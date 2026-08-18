import os
import sys
from datetime import date
from typing import Optional, Any
import pandas as pd
import numpy as np

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_3_energy_trends.service import EnergyTrendsService, DATA_DIR

WEEKDAY_NAMES = (
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
)

MONTH_NAMES = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
)

class PeakOffPeakService:

    @staticmethod
    def classify_mw(value: float, peak_threshold: float, off_peak_threshold: float) -> str:
        if value >= peak_threshold:
            return "peak"
        if value <= off_peak_threshold:
            return "off_peak"
        return "mid_range"

    @staticmethod
    def _hourly_analysis(
        region: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        peak_percentile: float = 75.0,
        off_peak_percentile: float = 25.0,
    ) -> dict[str, Any]:
        """
        Shared hourly averages + percentile classification for hourly and summary APIs.
        """
        if not (0 < off_peak_percentile < peak_percentile < 100):
            peak_percentile = 75.0
            off_peak_percentile = 25.0

        df = EnergyTrendsService.load_region_dataframe(region)

        if start_date:
            df = df[df.index >= pd.Timestamp(start_date)]
        if end_date:
            df = df[df.index <= pd.Timestamp(end_date) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)]

        by_hour = (
            df.assign(hour=df.index.hour)
            .groupby("hour")["consumption_mw"]
            .mean()
            .reindex(range(24))
            .dropna()
        )

        peak_threshold = float(by_hour.quantile(peak_percentile / 100.0))
        off_peak_threshold = float(by_hour.quantile(off_peak_percentile / 100.0))

        rows = []
        for hour, avg in by_hour.items():
            val = round(float(avg), 2)
            classification = PeakOffPeakService.classify_mw(val, peak_threshold, off_peak_threshold)
            rows.append({
                "hour": int(hour),
                "label": f"{int(hour):02d}:00",
                "average_mw": val,
                "classification": classification,
            })

        return {
            "df": df,
            "by_hour": by_hour,
            "rows": rows,
            "peak_threshold": round(peak_threshold, 2),
            "off_peak_threshold": round(off_peak_threshold, 2),
            "peak_percentile": peak_percentile,
            "off_peak_percentile": off_peak_percentile,
            "region": region.upper(),
            "start_date": start_date,
            "end_date": end_date,
        }

    @staticmethod
    def hourly_profile(
        region: str = "PJME",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        peak_percentile: float = 75.0,
        off_peak_percentile: float = 25.0,
    ) -> dict:
        """
        Returns average MW by hour-of-day (00:00 to 23:00) with peak/mid/off-peak classifications.
        """
        analysis = PeakOffPeakService._hourly_analysis(
            region, start_date, end_date, peak_percentile, off_peak_percentile
        )

        return {
            "region": analysis["region"],
            "start_date": analysis["start_date"],
            "end_date": analysis["end_date"],
            "unit": "MW",
            "peak_percentile": analysis["peak_percentile"],
            "off_peak_percentile": analysis["off_peak_percentile"],
            "peak_threshold_mw": analysis["peak_threshold"],
            "off_peak_threshold_mw": analysis["off_peak_threshold"],
            "threshold_basis": "hourly_averages",
            "data": analysis["rows"],
        }

    @staticmethod
    def peak_offpeak_summary(
        region: str = "PJME",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        peak_percentile: float = 75.0,
        off_peak_percentile: float = 25.0,
    ) -> dict:
        """
        Returns compact KPI summary: peak hours, off-peak hours, average peak MW, and peak-to-average ratio.
        """
        analysis = PeakOffPeakService._hourly_analysis(
            region, start_date, end_date, peak_percentile, off_peak_percentile
        )

        rows = analysis["rows"]
        by_hour = analysis["by_hour"]
        series = analysis["df"]["consumption_mw"]

        peak_hours = [r["hour"] for r in rows if r["classification"] == "peak"]
        off_peak_hours = [r["hour"] for r in rows if r["classification"] == "off_peak"]
        mid_range_hours = [r["hour"] for r in rows if r["classification"] == "mid_range"]

        peak_avgs = by_hour.loc[peak_hours] if peak_hours else pd.Series(dtype=float)
        off_peak_avgs = by_hour.loc[off_peak_hours] if off_peak_hours else pd.Series(dtype=float)

        avg_peak_mw = round(float(peak_avgs.mean()), 2) if len(peak_avgs) else None
        avg_off_peak_mw = round(float(off_peak_avgs.mean()), 2) if len(off_peak_avgs) else None
        overall_mean = round(float(series.mean()), 2)

        par = round(avg_peak_mw / overall_mean, 2) if avg_peak_mw and overall_mean else 1.0

        # Format peak hours range string
        def format_hour_range(hours_list):
            if not hours_list:
                return "None"
            return f"{min(hours_list):02d}:00 – {max(hours_list):02d}:00"

        return {
            "region": analysis["region"],
            "start_date": analysis["start_date"],
            "end_date": analysis["end_date"],
            "unit": "MW",
            "peak_percentile": analysis["peak_percentile"],
            "off_peak_percentile": analysis["off_peak_percentile"],
            "peak_threshold_mw": analysis["peak_threshold"],
            "off_peak_threshold_mw": analysis["off_peak_threshold"],
            "peak_hours": peak_hours,
            "peak_window_str": format_hour_range(peak_hours),
            "off_peak_hours": off_peak_hours,
            "off_peak_window_str": format_hour_range(off_peak_hours),
            "mid_range_hours": mid_range_hours,
            "average_peak_mw": avg_peak_mw,
            "average_off_peak_mw": avg_off_peak_mw,
            "overall_average_mw": overall_mean,
            "peak_to_average_ratio": par,
            "maximum_mw": round(float(series.max()), 2),
            "minimum_mw": round(float(series.min()), 2),
        }

    @staticmethod
    def weekday_profile(
        region: str = "PJME",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> dict:
        """Average MW consumption by day of week (Monday–Sunday)."""
        df = EnergyTrendsService.load_region_dataframe(region)
        if start_date:
            df = df[df.index >= pd.Timestamp(start_date)]
        if end_date:
            df = df[df.index <= pd.Timestamp(end_date) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)]

        by_weekday = (
            df.assign(weekday=df.index.dayofweek)
            .groupby("weekday")["consumption_mw"]
            .mean()
        )

        data = []
        for weekday_num, name in enumerate(WEEKDAY_NAMES):
            if weekday_num in by_weekday.index:
                data.append({
                    "day": name,
                    "day_number": weekday_num,
                    "average_mw": round(float(by_weekday.loc[weekday_num]), 2),
                })

        return {
            "region": region.upper(),
            "start_date": start_date,
            "end_date": end_date,
            "unit": "MW",
            "data": data,
        }

    @staticmethod
    def monthly_profile(
        region: str = "PJME",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> dict:
        """Average MW consumption by calendar month (January–December)."""
        df = EnergyTrendsService.load_region_dataframe(region)
        if start_date:
            df = df[df.index >= pd.Timestamp(start_date)]
        if end_date:
            df = df[df.index <= pd.Timestamp(end_date) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)]

        by_month = (
            df.assign(month=df.index.month)
            .groupby("month")["consumption_mw"]
            .mean()
        )

        data = []
        for month_number, name in enumerate(MONTH_NAMES, start=1):
            if month_number in by_month.index:
                data.append({
                    "month": name,
                    "month_number": month_number,
                    "average_mw": round(float(by_month.loc[month_number]), 2),
                })

        return {
            "region": region.upper(),
            "start_date": start_date,
            "end_date": end_date,
            "unit": "MW",
            "data": data,
        }
