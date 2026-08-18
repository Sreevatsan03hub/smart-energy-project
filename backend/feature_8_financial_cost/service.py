import os
import sys
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_3_energy_trends.service import EnergyTrendsService, DATA_DIR
from backend.feature_4_peak_analytics.service import PeakOffPeakService

class FinancialCostService:

    @staticmethod
    def _validate_tariff(tariff: float) -> float:
        try:
            val = float(tariff)
            if val <= 0 or not np.isfinite(val):
                return 0.12  # Standard US commercial electricity tariff ($0.12/kWh)
            return val
        except Exception:
            return 0.12

    @staticmethod
    def format_currency_usd(amount: float) -> Dict[str, Any]:
        """
        Formats dollar amounts cleanly in Millions ($M), Thousands ($k), or Billions ($B).
        """
        if amount >= 1_000_000_000:
            return {"formatted": f"${(amount / 1_000_000_000):.2f}B", "unit": "Billion USD", "raw": amount}
        elif amount >= 1_000_000:
            return {"formatted": f"${(amount / 1_000_000):.2f}M", "unit": "Million USD", "raw": amount}
        elif amount >= 1_000:
            return {"formatted": f"${(amount / 1_000):.1f}k", "unit": "Thousand USD", "raw": amount}
        else:
            return {"formatted": f"${amount:.2f}", "unit": "USD", "raw": amount}

    @staticmethod
    def get_cost_summary(region: str = "PJME", tariff: float = 0.12) -> Dict[str, Any]:
        """
        Calculates Today's Cost, This Week's Cost, This Month's Cost, Projected Cost, and Data-Driven Peak Surcharges.
        """
        region = region.strip().upper()
        tariff = FinancialCostService._validate_tariff(tariff)
        df = EnergyTrendsService.load_region_dataframe(region)

        # 1. Today's Cost (Most recent 24-hour day in data)
        df_sorted = df.sort_index()
        last_dt = df_sorted.index.max()
        last_date = last_dt.date()
        today_df = df_sorted[df_sorted.index.date == last_date]
        if len(today_df) < 24:
            today_df = df_sorted.tail(24)

        today_mwh = float(today_df["consumption_mw"].sum())
        today_cost_usd = round(today_mwh * 1000.0 * tariff, 2)

        # 2. This Week's Cost (Past 7 calendar days = 168 hours)
        week_df = df_sorted.tail(168)
        this_week_mwh = float(week_df["consumption_mw"].sum())
        this_week_cost_usd = round(this_week_mwh * 1000.0 * tariff, 2)

        # 3. This Month's Actual Spend (Past 30 calendar days = 720 hours)
        month_df = df_sorted.tail(720)
        this_month_mwh = float(month_df["consumption_mw"].sum())
        this_month_cost_usd = round(this_month_mwh * 1000.0 * tariff, 2)

        # 4. Projected Monthly Budget Run-Rate (Daily Average * 30)
        avg_daily_mwh = this_month_mwh / 30.0
        projected_monthly_mwh = avg_daily_mwh * 30.0
        projected_monthly_cost_usd = round(projected_monthly_mwh * 1000.0 * tariff, 2)

        # 5. Data-Driven Peak Windows from Feature 4 Analytics Engine
        peak_summary = PeakOffPeakService.peak_offpeak_summary(region)
        peak_hours = set(peak_summary.get("peak_hours", [17, 18, 19, 20]))
        off_peak_hours = set(peak_summary.get("off_peak_hours", [2, 3, 4, 5]))

        month_hours = month_df.index.hour
        peak_mask = month_hours.isin(peak_hours)
        offpeak_mask = month_hours.isin(off_peak_hours)

        peak_df = month_df[peak_mask]
        offpeak_df = month_df[offpeak_mask]

        peak_mwh = float(peak_df["consumption_mw"].sum())
        offpeak_mwh = float(offpeak_df["consumption_mw"].sum())
        standard_operating_df = month_df[~peak_mask & ~offpeak_mask]
        standard_mwh = float(standard_operating_df["consumption_mw"].sum())

        avg_peak_mw = float(peak_df["consumption_mw"].mean()) if not peak_df.empty else 0.0
        avg_offpeak_mw = float(offpeak_df["consumption_mw"].mean()) if not offpeak_df.empty else 0.0
        
        # Surcharge = excess demand above the empirical off-peak baseload
        peak_surcharge_mw = max(0.0, avg_peak_mw - avg_offpeak_mw)
        peak_hours_count = max(1, len(peak_hours))
        peak_surcharge_monthly_usd = round(peak_surcharge_mw * peak_hours_count * 30.0 * 1000.0 * tariff, 2)
        peak_penalty_daily_usd = round(peak_surcharge_monthly_usd / 30.0, 2)

        offpeak_cost_usd = offpeak_mwh * 1000.0 * tariff
        standard_cost_usd = standard_mwh * 1000.0 * tariff
        peak_cost_usd = peak_mwh * 1000.0 * tariff
        base_operating_cost_usd = max(0.0, (peak_cost_usd + standard_cost_usd) - peak_surcharge_monthly_usd)

        # Quantified Avoidable Savings (Peak Shifting + Baseload Night Setback)
        par = peak_summary.get("peak_to_average_ratio", 1.25)
        savings_ratio = min(0.35, max(0.08, (par - 1.0) * 0.5))
        potential_savings_usd = round(peak_surcharge_monthly_usd * savings_ratio, 2)

        # 3-Slice Expenditure Breakdown
        total_expenditure = offpeak_cost_usd + base_operating_cost_usd + peak_surcharge_monthly_usd
        if total_expenditure <= 0:
            total_expenditure = 1.0

        breakdown = [
            {
                "category": "Base Off-Peak Energy",
                "costUSD": round(offpeak_cost_usd, 2),
                "costFormatted": f"${(offpeak_cost_usd / 1_000_000):.2f}M" if offpeak_cost_usd >= 1_000_000 else f"${(offpeak_cost_usd / 1_000):.1f}k",
                "pct": round((offpeak_cost_usd / total_expenditure) * 100.0, 1),
                "color": "#0B63E5"
            },
            {
                "category": "Standard Operating Energy",
                "costUSD": round(base_operating_cost_usd, 2),
                "costFormatted": f"${(base_operating_cost_usd / 1_000_000):.2f}M" if base_operating_cost_usd >= 1_000_000 else f"${(base_operating_cost_usd / 1_000):.1f}k",
                "pct": round((base_operating_cost_usd / total_expenditure) * 100.0, 1),
                "color": "#00B33C"
            },
            {
                "category": "Peak Surcharge Penalty",
                "costUSD": round(peak_surcharge_monthly_usd, 2),
                "costFormatted": f"${(peak_surcharge_monthly_usd / 1_000_000):.2f}M" if peak_surcharge_monthly_usd >= 1_000_000 else f"${(peak_surcharge_monthly_usd / 1_000):.1f}k",
                "pct": round((peak_surcharge_monthly_usd / total_expenditure) * 100.0, 1),
                "color": "#DC2626"
            }
        ]

        return {
            "region": region,
            "tariffRateUSD": tariff,
            "currency": "USD",
            "currencySymbol": "$",
            # Backward-compatible keys
            "todayCostINR": today_cost_usd,
            "thisWeekCostINR": this_week_cost_usd,
            "thisMonthCostINR": this_month_cost_usd,
            "projectedMonthlyCostINR": projected_monthly_cost_usd,
            "dailyCostINR": today_cost_usd,
            "monthlyCostINR": projected_monthly_cost_usd,
            "peakPenaltyCostINR": peak_penalty_daily_usd,
            "potentialMonthlySavingsINR": potential_savings_usd,
            # Native USD Fields
            "todayCostUSD": today_cost_usd,
            "todayMWh": round(today_mwh, 2),
            "todayCostFormatted": FinancialCostService.format_currency_usd(today_cost_usd),
            "thisWeekCostUSD": this_week_cost_usd,
            "thisWeekMWh": round(this_week_mwh, 2),
            "thisWeekCostFormatted": FinancialCostService.format_currency_usd(this_week_cost_usd),
            "thisMonthCostUSD": this_month_cost_usd,
            "thisMonthMWh": round(this_month_mwh, 2),
            "thisMonthCostFormatted": FinancialCostService.format_currency_usd(this_month_cost_usd),
            "projectedMonthlyCostUSD": projected_monthly_cost_usd,
            "projectedMonthlyCostFormatted": FinancialCostService.format_currency_usd(projected_monthly_cost_usd),
            "peakPenaltyDailyUSD": peak_penalty_daily_usd,
            "peakPenaltyDailyFormatted": FinancialCostService.format_currency_usd(peak_penalty_daily_usd),
            "peakPenaltyMonthlyUSD": peak_surcharge_monthly_usd,
            "potentialMonthlySavingsUSD": potential_savings_usd,
            "potentialMonthlySavingsFormatted": FinancialCostService.format_currency_usd(potential_savings_usd),
            "costTrendBreakdown": breakdown,
            "peakHoursDetected": sorted(list(peak_hours)),
            "summaryText": f"At ${tariff:.2f}/kWh, {region} incurs a daily run-rate of ${(today_cost_usd/1_000_000):.2f}M and projected monthly spend of ${(projected_monthly_cost_usd/1_000_000):.2f}M."
        }

    @staticmethod
    def get_cost_trends(
        region: str = "PJME",
        tariff: float = 0.12,
        interval: str = "daily",
        limit: int = 30
    ) -> Dict[str, Any]:
        """
        Returns resampled multi-scale financial time-series (hourly, daily, weekly, monthly) in USD.
        """
        region = region.strip().upper()
        tariff = FinancialCostService._validate_tariff(tariff)
        df = EnergyTrendsService.load_region_dataframe(region)

        rule_map = {
            "hourly": "1h",
            "daily": "1D",
            "weekly": "1W-MON",
            "monthly": "1ME"
        }
        rule = rule_map.get(interval.lower(), "1D")

        if interval.lower() == "hourly":
            resampled = df["consumption_mw"].tail(limit if limit else 168)
            series_mwh = resampled
        else:
            resampled = df["consumption_mw"].resample(rule).sum().dropna()
            if limit:
                resampled = resampled.tail(limit)
            series_mwh = resampled

        data_points = []
        for dt, mwh_val in series_mwh.items():
            mwh_float = float(mwh_val)
            cost_usd = round(mwh_float * 1000.0 * tariff, 2)

            if interval.lower() == "hourly":
                label = dt.strftime("%b %d %H:00")
            elif interval.lower() == "daily":
                label = dt.strftime("%b %d")
            elif interval.lower() == "weekly":
                label = f"Wk of {dt.strftime('%b %d')}"
            else:
                label = dt.strftime("%b %Y")

            data_points.append({
                "timestamp": dt.isoformat(),
                "label": label,
                "mwh": round(mwh_float, 2),
                "costUSD": cost_usd,
                "costMillions": round(cost_usd / 1_000_000.0, 3),
                "costThousands": round(cost_usd / 1_000.0, 1),
                "costLakhs": round(cost_usd / 1_000_000.0, 3), # mapped to Millions for chart scaling
                "formatted": f"${(cost_usd / 1_000_000):.2f}M" if cost_usd >= 1_000_000 else f"${(cost_usd / 1_000):.1f}k"
            })

        return {
            "region": region,
            "tariffRateUSD": tariff,
            "currency": "USD",
            "interval": interval.upper(),
            "count": len(data_points),
            "data": data_points
        }

    @staticmethod
    def get_recommendations(region: str = "PJME") -> List[Dict[str, Any]]:
        """
        Delegates to Feature 10 RecommendationEngineService for dynamic generation.
        """
        from backend.feature_10_recommendations.service import RecommendationEngineService
        return RecommendationEngineService.generate_recommendations(region=region, tariff=0.12)
