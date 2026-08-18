import os
import sys
from datetime import date
from typing import Optional, Literal
import pandas as pd
import numpy as np

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

DATA_DIR = os.path.join(BASE_DIR, "data", "processed")

INTERVAL_RULES = {
    "hourly": "h",
    "daily": "D",
    "weekly": "W",
    "monthly": "ME",
}

class EnergyTrendsService:

    @staticmethod
    def list_regions() -> list[str]:
        """Return available region codes from cleaned CSV files."""
        if not os.path.exists(DATA_DIR):
            return []
        return sorted([
            f.replace("_cleaned.csv", "").upper()
            for f in os.listdir(DATA_DIR)
            if f.endswith("_cleaned.csv")
        ])

    @staticmethod
    def load_region_dataframe(region: str) -> pd.DataFrame:
        """
        Loads cleaned region CSV, standardizes column to 'consumption_mw',
        and sets Datetime index.
        """
        region = region.strip().upper()
        path = os.path.join(DATA_DIR, f"{region}_cleaned.csv")

        if not os.path.exists(path):
            raise FileNotFoundError(f"Region '{region}' cleaned dataset not found at {path}")

        df = pd.read_csv(path)
        if "Datetime" not in df.columns:
            raise ValueError(f"Missing 'Datetime' column in {path}")

        value_col = f"{region}_MW"
        if value_col not in df.columns:
            candidates = [c for c in df.columns if c != "Datetime"]
            if not candidates:
                raise ValueError(f"No consumption column found in {path}")
            value_col = candidates[0]

        df["Datetime"] = pd.to_datetime(df["Datetime"], errors="coerce")
        df = df.rename(columns={value_col: "consumption_mw"})
        df = df[["Datetime", "consumption_mw"]].dropna()
        df = df.set_index("Datetime").sort_index()
        return df

    @staticmethod
    def get_trends(
        region: str = "PJME",
        interval: str = "daily",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None
    ) -> dict:
        """
        Returns multiscale aggregated time-series points for line & bar charts.
        Supported intervals: 'hourly', 'daily', 'weekly', 'monthly'.
        """
        region = region.strip().upper()
        interval = interval.lower()
        if interval not in INTERVAL_RULES:
            interval = "daily"

        df = EnergyTrendsService.load_region_dataframe(region)

        # Apply optional date filters
        if start_date:
            df = df[df.index >= pd.Timestamp(start_date)]
        if end_date:
            df = df[df.index <= pd.Timestamp(end_date) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)]

        if df.empty:
            return {
                "region": region,
                "interval": interval,
                "records": 0,
                "unit": "MW",
                "data": []
            }

        rule = INTERVAL_RULES[interval]

        if interval == "hourly":
            # For hourly without explicit date filters, take the last 168 hours (7 days) for responsive UI
            if not start_date and not end_date:
                sub_df = df.tail(limit or 168)
            else:
                sub_df = df.head(limit) if limit else df

            series_mean = sub_df["consumption_mw"]
            series_max = series_mean
            series_min = series_mean
        else:
            # Resample for Daily, Weekly, Monthly
            resampled = df["consumption_mw"].resample(rule)
            series_mean = resampled.mean().dropna()
            series_max = resampled.max().dropna()
            series_min = resampled.min().dropna()

            if limit:
                series_mean = series_mean.tail(limit)
                series_max = series_max.tail(limit)
                series_min = series_min.tail(limit)

        points = []
        for ts in series_mean.index:
            val_mean = float(series_mean.loc[ts])
            val_max = float(series_max.loc[ts]) if ts in series_max.index else val_mean
            val_min = float(series_min.loc[ts]) if ts in series_min.index else val_mean

            if interval == "hourly":
                label = ts.strftime("%b %d %H:%M")
            elif interval == "daily":
                label = ts.strftime("%b %d, %Y")
            elif interval == "weekly":
                label = f"W{ts.strftime('%U')} ({ts.strftime('%b %d')})"
            else:
                label = ts.strftime("%b %Y")

            points.append({
                "datetime": ts.isoformat(),
                "label": label,
                "usage_mw": round(val_mean, 2),
                "max_mw": round(val_max, 2),
                "min_mw": round(val_min, 2),
            })

        return {
            "region": region,
            "interval": interval,
            "start_date": start_date,
            "end_date": end_date,
            "unit": "MW",
            "records": len(points),
            "data": points
        }

    @staticmethod
    def get_trends_summary(
        region: str = "PJME",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> dict:
        """
        Calculates executive KPI cards: Total Consumption, Average Demand, Peak Demand, Lowest Baseload.
        """
        region = region.strip().upper()
        df = EnergyTrendsService.load_region_dataframe(region)

        if start_date:
            df = df[df.index >= pd.Timestamp(start_date)]
        if end_date:
            df = df[df.index <= pd.Timestamp(end_date) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)]

        if df.empty:
            return {
                "region": region,
                "total_mwh": 0,
                "average_mw": 0,
                "peak_mw": 0,
                "peak_datetime": None,
                "lowest_mw": 0,
                "lowest_datetime": None,
                "sample_count": 0
            }

        series = df["consumption_mw"]
        peak_idx = series.idxmax()
        low_idx = series.idxmin()

        # Total energy throughput in MWh (sum of hourly MW readings)
        total_mwh = float(series.sum())
        avg_mw = float(series.mean())
        peak_mw = float(series.max())
        low_mw = float(series.min())

        return {
            "region": region,
            "start_date": start_date,
            "end_date": end_date,
            "unit": "MW",
            "total_mwh": round(total_mwh, 1),
            "total_gwh": round(total_mwh / 1000, 2),
            "average_mw": round(avg_mw, 2),
            "peak_mw": round(peak_mw, 2),
            "peak_datetime": pd.Timestamp(peak_idx).strftime("%b %d, %Y %H:%M"),
            "lowest_mw": round(low_mw, 2),
            "lowest_datetime": pd.Timestamp(low_idx).strftime("%b %d, %Y %H:%M"),
            "sample_count": int(series.count())
        }
