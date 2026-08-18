import os
import sys
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

PATTERNS_DIR = os.path.join(BASE_DIR, "data", "processed", "patterns")

class HistoricalPatternService:

    @staticmethod
    def _get_file_path(filename: str) -> str:
        path = os.path.join(PATTERNS_DIR, filename)
        if not os.path.exists(path):
            # Fallback to historical_patterns root if not yet copied
            fallback = os.path.join(BASE_DIR, "historical_patterns", filename)
            if os.path.exists(fallback):
                return fallback
            raise FileNotFoundError(f"Pattern file not found: {filename}")
        return path

    @staticmethod
    def get_hourly_pattern(region: str = "PJME") -> Dict[str, Any]:
        """
        Returns 24-hour diurnal baseline (00:00 to 23:00) with mean, min, max, and 1-sigma variation band.
        """
        region = region.strip().upper()
        path = HistoricalPatternService._get_file_path(f"{region}_hourly_pattern.csv")
        df = pd.read_csv(path)

        data = []
        for _, row in df.iterrows():
            hour = int(row["hour"])
            avg = round(float(row["average_consumption"]), 2)
            mn = round(float(row["minimum_consumption"]), 2)
            mx = round(float(row["maximum_consumption"]), 2)
            var = round(float(row["variation"]), 2)

            data.append({
                "hour": hour,
                "label": f"{hour:02d}:00",
                "average_mw": avg,
                "min_mw": mn,
                "max_mw": mx,
                "variation_mw": var,
                "band_upper_mw": round(avg + var, 2),
                "band_lower_mw": round(max(0, avg - var), 2),
            })

        # Key Discoveries
        peak_row = max(data, key=lambda x: x["average_mw"])
        lowest_row = min(data, key=lambda x: x["average_mw"])

        return {
            "region": region,
            "pattern_type": "HOURLY_DIURNAL",
            "peak_hour": peak_row["label"],
            "peak_average_mw": peak_row["average_mw"],
            "lowest_hour": lowest_row["label"],
            "lowest_average_mw": lowest_row["average_mw"],
            "diurnal_swing_mw": round(peak_row["average_mw"] - lowest_row["average_mw"], 2),
            "diurnal_swing_pct": round(((peak_row["average_mw"] - lowest_row["average_mw"]) / lowest_row["average_mw"]) * 100, 1),
            "data": data
        }

    @staticmethod
    def get_daily_pattern(region: str = "PJME") -> Dict[str, Any]:
        """
        Returns 7-day weekly profile (Monday through Sunday).
        """
        region = region.strip().upper()
        path = HistoricalPatternService._get_file_path(f"{region}_daily_pattern.csv")
        df = pd.read_csv(path)

        data = []
        for _, row in df.iterrows():
            data.append({
                "day_number": int(row["day_number"]),
                "day_name": str(row["day_name"]),
                "average_mw": round(float(row["average_consumption"]), 2),
                "min_mw": round(float(row["minimum_consumption"]), 2),
                "max_mw": round(float(row["maximum_consumption"]), 2),
                "variation_mw": round(float(row["variation"]), 2)
            })

        highest_day = max(data, key=lambda x: x["average_mw"])
        lowest_day = min(data, key=lambda x: x["average_mw"])

        return {
            "region": region,
            "pattern_type": "DAY_OF_WEEK",
            "highest_day": highest_day["day_name"],
            "highest_average_mw": highest_day["average_mw"],
            "lowest_day": lowest_day["day_name"],
            "lowest_average_mw": lowest_day["average_mw"],
            "weekday_drop_pct": round(((highest_day["average_mw"] - lowest_day["average_mw"]) / highest_day["average_mw"]) * 100, 1),
            "data": data
        }

    @staticmethod
    def get_monthly_pattern(region: str = "PJME") -> Dict[str, Any]:
        """
        Returns 12-month seasonal macro cycles (January through December).
        """
        region = region.strip().upper()
        path = HistoricalPatternService._get_file_path(f"{region}_monthly_pattern.csv")
        df = pd.read_csv(path)

        data = []
        for _, row in df.iterrows():
            data.append({
                "month_number": int(row["month_number"]),
                "month_name": str(row["month_name"]),
                "average_mw": round(float(row["average_consumption"]), 2),
                "min_mw": round(float(row["minimum_consumption"]), 2),
                "max_mw": round(float(row["maximum_consumption"]), 2),
                "variation_mw": round(float(row["variation"]), 2)
            })

        highest_month = max(data, key=lambda x: x["average_mw"])
        lowest_month = min(data, key=lambda x: x["average_mw"])

        return {
            "region": region,
            "pattern_type": "MONTHLY_SEASONAL",
            "highest_month": highest_month["month_name"],
            "highest_average_mw": highest_month["average_mw"],
            "lowest_month": lowest_month["month_name"],
            "lowest_average_mw": lowest_month["average_mw"],
            "seasonal_swing_pct": round(((highest_month["average_mw"] - lowest_month["average_mw"]) / lowest_month["average_mw"]) * 100, 1),
            "data": data
        }

    @staticmethod
    def get_weekday_weekend_pattern(region: str = "PJME") -> Dict[str, Any]:
        """
        Returns Weekday vs. Weekend comparative split.
        """
        region = region.strip().upper()
        path = HistoricalPatternService._get_file_path(f"{region}_weekday_weekend.csv")
        df = pd.read_csv(path)

        data = []
        for _, row in df.iterrows():
            data.append({
                "day_type": str(row["day_type"]),
                "average_mw": round(float(row["average_consumption"]), 2),
                "min_mw": round(float(row["minimum_consumption"]), 2),
                "max_mw": round(float(row["maximum_consumption"]), 2),
                "variation_mw": round(float(row["variation"]), 2)
            })

        weekday = next((d for d in data if d["day_type"] == "Weekday"), None)
        weekend = next((d for d in data if d["day_type"] == "Weekend"), None)

        drop_pct = 0.0
        if weekday and weekend and weekday["average_mw"] > 0:
            drop_pct = round(((weekday["average_mw"] - weekend["average_mw"]) / weekday["average_mw"]) * 100, 1)

        return {
            "region": region,
            "pattern_type": "WEEKDAY_VS_WEEKEND",
            "weekday_average_mw": weekday["average_mw"] if weekday else 0,
            "weekend_average_mw": weekend["average_mw"] if weekend else 0,
            "weekend_setback_pct": drop_pct,
            "data": data
        }

    @staticmethod
    def get_pattern_summary(region: str = "PJME") -> Dict[str, Any]:
        """
        Returns unified pattern summary synthesizing Hourly, Weekly, and Monthly findings.
        """
        region = region.strip().upper()
        path = HistoricalPatternService._get_file_path("ALL_REGIONS_HISTORICAL_PATTERN_SUMMARY.csv")
        df = pd.read_csv(path)

        row = df[df["Region"].str.upper() == region]
        if row.empty:
            # Fallback to PJME if region not found
            row = df[df["Region"].str.upper() == "PJME"]

        r = row.iloc[0]

        return {
            "region": region,
            "total_historical_records": int(r["Rows"]),
            "peak_hour": str(r["Peak_Hour"]),
            "peak_hour_avg_mw": round(float(r["Peak_Hour_Average_MW"]), 2),
            "lowest_hour": str(r["Lowest_Hour"]),
            "lowest_hour_avg_mw": round(float(r["Lowest_Hour_Average_MW"]), 2),
            "highest_day": str(r["Highest_Day"]),
            "highest_day_avg_mw": round(float(r["Highest_Day_Average_MW"]), 2),
            "lowest_day": str(r["Lowest_Day"]),
            "lowest_day_avg_mw": round(float(r["Lowest_Day_Average_MW"]), 2),
            "highest_month": str(r["Highest_Month"]),
            "highest_month_avg_mw": round(float(r["Highest_Month_Average_MW"]), 2),
            "lowest_month": str(r["Lowest_Month"]),
            "lowest_month_avg_mw": round(float(r["Lowest_Month_Average_MW"]), 2),
            "insights": [
                f"Peak diurnal operating pressure occurs daily at {r['Peak_Hour']} ({round(float(r['Peak_Hour_Average_MW']), 0):,} MW).",
                f"Lowest baseload setback occurs at {r['Lowest_Hour']} ({round(float(r['Lowest_Hour_Average_MW']), 0):,} MW).",
                f"{r['Highest_Day']}s drive the highest weekly load, while {r['Lowest_Day']}s see an industrial setback.",
                f"Annual peak cooling demands occur in {r['Highest_Month']}, while {r['Lowest_Month']} represents the annual baseline trough."
            ]
        }

    @staticmethod
    def get_all_regions_summary() -> List[Dict[str, Any]]:
        """
        Returns full cross-region benchmark table.
        """
        path = HistoricalPatternService._get_file_path("ALL_REGIONS_HISTORICAL_PATTERN_SUMMARY.csv")
        df = pd.read_csv(path)
        return df.to_dict(orient="records")
