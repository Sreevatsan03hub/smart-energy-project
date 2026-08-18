import os
import sys
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_4_peak_analytics.service import PeakOffPeakService
from backend.feature_5_historical_patterns.service import HistoricalPatternService
from backend.feature_2_anomaly_detection.service import AnomalyDetectionService
from backend.feature_8_financial_cost.service import FinancialCostService

class RecommendationEngineService:

    @staticmethod
    def generate_recommendations(region: str = "PJME", tariff: float = 0.12) -> List[Dict[str, Any]]:
        """
        Dynamically scans regional telemetry across 5 inefficiency detectors to produce
        quantified, actionable engineering recommendations.
        """
        region = region.strip().upper()
        tariff = max(0.01, float(tariff))

        # 1. Fetch live telemetry statistics across engines
        cost_summary = FinancialCostService.get_cost_summary(region, tariff)
        peak_summary = PeakOffPeakService.peak_offpeak_summary(region)
        hourly_pattern = HistoricalPatternService.get_hourly_pattern(region)
        weekend_pattern = HistoricalPatternService.get_weekday_weekend_pattern(region)
        monthly_pattern = HistoricalPatternService.get_monthly_pattern(region)
        anomaly_results = AnomalyDetectionService.get_anomalies(region, limit=20)

        recommendations: List[Dict[str, Any]] = []

        # =========================================================================
        # DETECTOR 1: Peak Demand Surcharge & Diurnal Load Shifting
        # =========================================================================
        par = peak_summary.get("peak_to_average_ratio", 1.25)
        peak_hours = peak_summary.get("peak_hours", [17, 18, 19])
        avg_peak_mw = peak_summary.get("average_peak_mw", 0.0)
        avg_offpeak_mw = peak_summary.get("average_off_peak_mw", 0.0)
        peak_hours_str = ", ".join([f"{h:02d}:00" for h in sorted(peak_hours)[:4]])

        if par >= 1.10:
            # Shift 8% of excess peak load into lowest off-peak hours
            shift_mw = round(max(5.0, (avg_peak_mw - avg_offpeak_mw) * 0.08), 1)
            monthly_hours = len(peak_hours) * 30
            rec1_savings_usd = round(shift_mw * monthly_hours * 1000.0 * tariff * 0.40, 2)
            co2_tons = round(shift_mw * monthly_hours * 0.42, 1)

            priority = "CRITICAL" if rec1_savings_usd >= 1_000_000 else "HIGH" if rec1_savings_usd >= 250_000 else "MEDIUM"

            recommendations.append({
                "id": "REC-01",
                "title": "Diurnal Peak Load Shifting & Pre-Cooling",
                "category": "Peak Demand Management",
                "priority": priority,
                "problem": f"Daily peak consumption surges to an average of {avg_peak_mw:,.0f} MW during {peak_hours_str} (Peak-to-Average Ratio: {par:.2f}x), generating avoidable peak demand surcharges.",
                "reason": f"Coincident commercial HVAC and process ramp-up concentrates {par:.2f}x higher demand pressure during high-tariff grid hours.",
                "suggestedAction": f"Shift {shift_mw:,.0f} MW of non-critical thermal pump and chiller load into low-tariff overnight hours (01:00–05:00) using automated building pre-cooling.",
                "potentialMonthlySavingsUSD": rec1_savings_usd,
                "savingsFormatted": f"${(rec1_savings_usd / 1_000_000):.2f}M / mo" if rec1_savings_usd >= 1_000_000 else f"${(rec1_savings_usd / 1_000):.1f}k / mo",
                "peakReductionMW": shift_mw,
                "co2ReductionTons": co2_tons,
                "paybackMonths": 1.8
            })

        # =========================================================================
        # DETECTOR 2: Overnight Baseload Waste & Equipment Setback
        # =========================================================================
        lowest_mw = hourly_pattern.get("lowest_average_mw", 0.0)
        peak_avg_mw = hourly_pattern.get("peak_average_mw", 1.0)
        lowest_hour = hourly_pattern.get("lowest_hour", "04:00")
        night_ratio = lowest_mw / peak_avg_mw if peak_avg_mw > 0 else 0.70

        if night_ratio >= 0.50:
            # Opportunity to reduce unnecessary overnight baseload by 4%
            setback_mw = round(lowest_mw * 0.04, 1)
            night_hours = 6 * 30  # 6 overnight hours per night for 30 days
            rec2_savings_usd = round(setback_mw * night_hours * 1000.0 * tariff, 2)
            co2_tons = round(setback_mw * night_hours * 0.42, 1)

            priority = "CRITICAL" if rec2_savings_usd >= 1_000_000 else "HIGH" if rec2_savings_usd >= 250_000 else "MEDIUM"

            recommendations.append({
                "id": "REC-02",
                "title": "Overnight Baseload Automated Equipment Setback",
                "category": "Baseload Efficiency",
                "priority": priority,
                "problem": f"Nighttime baseload at {lowest_hour} remains high at {lowest_mw:,.0f} MW ({night_ratio*100:.1f}% of peak load) during non-operational facility hours.",
                "reason": "Unoccupied facility zones continue running auxiliary air handlers, server cooling, and baseline lighting without automated setback schedules.",
                "suggestedAction": f"Configure Building Management System (BMS) setback routines to step down ventilation and secondary water pumps between 00:00 and 05:00, curtailing {setback_mw:,.0f} MW.",
                "potentialMonthlySavingsUSD": rec2_savings_usd,
                "savingsFormatted": f"${(rec2_savings_usd / 1_000_000):.2f}M / mo" if rec2_savings_usd >= 1_000_000 else f"${(rec2_savings_usd / 1_000):.1f}k / mo",
                "peakReductionMW": setback_mw,
                "co2ReductionTons": co2_tons,
                "paybackMonths": 0.5
            })

        # =========================================================================
        # DETECTOR 3: Persistent Anomaly Spikes Mitigation
        # =========================================================================
        anomaly_results = AnomalyDetectionService.get_anomalies(region, limit=20)
        anomalies_count = anomaly_results.get("totalAnomalies", 0)
        recent_anomalies = anomaly_results.get("anomalies", [])

        if anomalies_count > 0 and len(recent_anomalies) > 0:
            top_spike = recent_anomalies[0]
            spike_mw = float(top_spike.get("actualMW", 0.0))
            expected_mw = float(top_spike.get("expectedMW", 0.0))
            dev_pct = float(top_spike.get("deviationPct", 15.0))

            curtail_mw = round(max(5.0, abs(spike_mw - expected_mw) * 0.5), 1)
            rec3_savings_usd = round(curtail_mw * 40 * 1000.0 * tariff, 2)
            co2_tons = round(curtail_mw * 40 * 0.42, 1)

            priority = "CRITICAL" if rec3_savings_usd >= 1_000_000 else "HIGH" if rec3_savings_usd >= 250_000 else "MEDIUM"

            recommendations.append({
                "id": "REC-03",
                "title": "Unplanned Demand Spike & Fault Mitigation",
                "category": "Fault Detection & Diagnostics",
                "priority": priority,
                "problem": f"Detected {anomalies_count} statistically significant anomaly events, including a +{dev_pct:.1f}% surge ({spike_mw:,.0f} MW vs {expected_mw:,.0f} MW baseline).",
                "reason": "Simultaneous start-up of secondary refrigeration compressors and large inductive loads without sequential interlocks.",
                "suggestedAction": "Implement staggered motor soft-starters and sequential staging logic to eliminate transient inrush spikes.",
                "potentialMonthlySavingsUSD": rec3_savings_usd,
                "savingsFormatted": f"${(rec3_savings_usd / 1_000_000):.2f}M / mo" if rec3_savings_usd >= 1_000_000 else f"${(rec3_savings_usd / 1_000):.1f}k / mo",
                "peakReductionMW": curtail_mw,
                "co2ReductionTons": co2_tons,
                "paybackMonths": 2.4
            })

        # =========================================================================
        # DETECTOR 4: Weekend Energy Setback Optimization
        # =========================================================================
        weekend_drop_pct = weekend_pattern.get("weekend_setback_pct", 9.7)
        weekday_avg = weekend_pattern.get("weekday_average_mw", 0.0)
        weekend_avg = weekend_pattern.get("weekend_average_mw", 0.0)

        if weekend_drop_pct < 15.0:
            potential_additional_drop = round(weekday_avg * 0.03, 1)
            weekend_hours = 48 * 4 # 8 weekend days per month
            rec4_savings_usd = round(potential_additional_drop * weekend_hours * 1000.0 * tariff, 2)
            co2_tons = round(potential_additional_drop * weekend_hours * 0.42, 1)

            recommendations.append({
                "id": "REC-04",
                "title": "Weekend Facility Setback Deep-Sleep Scheduling",
                "category": "Operational Scheduling",
                "priority": "MEDIUM",
                "problem": f"Weekend load reduction is currently only {weekend_drop_pct:.1f}% ({weekend_avg:,.0f} MW vs {weekday_avg:,.0f} MW weekday average), indicating non-essential weekend energy consumption.",
                "reason": "Facility lighting, HVAC chillers, and auxiliary elevators remain active in standby mode on Saturdays and Sundays.",
                "suggestedAction": f"Implement automated weekend deep-sleep setback protocols to achieve an additional {potential_additional_drop:,.0f} MW curtailment across weekend operating hours.",
                "potentialMonthlySavingsUSD": rec4_savings_usd,
                "savingsFormatted": f"${(rec4_savings_usd / 1_000_000):.2f}M / mo" if rec4_savings_usd >= 1_000_000 else f"${(rec4_savings_usd / 1_000):.1f}k / mo",
                "peakReductionMW": potential_additional_drop,
                "co2ReductionTons": co2_tons,
                "paybackMonths": 0.8
            })

        # =========================================================================
        # DETECTOR 5: Seasonal HVAC Cooling Optimization
        # =========================================================================
        seasonal_swing_pct = monthly_pattern.get("seasonal_swing_pct", 36.0)
        highest_month = monthly_pattern.get("highest_month", "July")
        highest_month_mw = monthly_pattern.get("highest_average_mw", 0.0)
        lowest_month = monthly_pattern.get("lowest_month", "April")

        if seasonal_swing_pct >= 20.0:
            chiller_tuning_mw = round(highest_month_mw * 0.025, 1)
            seasonal_hours = 720
            rec5_savings_usd = round(chiller_tuning_mw * seasonal_hours * 1000.0 * tariff * 0.5, 2)
            co2_tons = round(chiller_tuning_mw * seasonal_hours * 0.42, 1)

            recommendations.append({
                "id": "REC-05",
                "title": f"Seasonal Chiller Optimization for {highest_month} Cooling Peak",
                "category": "Thermal Plant Efficiency",
                "priority": "MEDIUM",
                "problem": f"Macro weather swing drives a +{seasonal_swing_pct:.1f}% energy surge in {highest_month} ({highest_month_mw:,.0f} MW) compared to baseline month {lowest_month}.",
                "reason": "High condenser water temperature and fouling resistance increase chiller kW/ton coefficient of performance during summer peaks.",
                "suggestedAction": f"Perform condenser coil chemical descaling and optimize chilled water setpoint reset (+1.5°F), yielding {chiller_tuning_mw:,.0f} MW efficiency gain.",
                "potentialMonthlySavingsUSD": rec5_savings_usd,
                "savingsFormatted": f"${(rec5_savings_usd / 1_000_000):.2f}M / mo" if rec5_savings_usd >= 1_000_000 else f"${(rec5_savings_usd / 1_000):.1f}k / mo",
                "peakReductionMW": chiller_tuning_mw,
                "co2ReductionTons": co2_tons,
                "paybackMonths": 3.2
            })

        # Sort recommendations by potential savings (descending)
        recommendations.sort(key=lambda x: x["potentialMonthlySavingsUSD"], reverse=True)
        return recommendations
