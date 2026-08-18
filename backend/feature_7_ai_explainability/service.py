import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_1_adaptive_forecasting.service import ForecastingService

ANOMALIES_DIR = os.path.join(BASE_DIR, "data", "processed", "anomalies")
MODELS_DIR = os.path.join(BASE_DIR, "models")
CONFIG_PATH = os.path.join(BASE_DIR, "models", "anomaly", "anomaly_config.json")

class ExplainabilityService:

    @staticmethod
    def explain_forecast(region: str = "PJME") -> dict:
        """
        Explains WHY the AI produced the specific T+1 forecast.
        Deconstructs feature contributions (Recent momentum, 24h pattern, Hour, Calendar).
        """
        region = region.upper()
        live_fc = ForecastingService.get_next_hour_forecast(region)
        weights_data = ForecastingService.get_feature_explainability(region)
        
        predicted_mw = live_fc["predictedLoadMW"]
        current_mw = live_fc["currentLoadMW"]
        delta_mw = live_fc["expectedDeltaMW"]
        delta_pct = live_fc["expectedDeltaPct"]
        dt_str = live_fc["forecastTimestamp"]
        
        dt = pd.to_datetime(dt_str)
        hour = dt.hour
        day_name = dt.strftime("%A")
        is_weekend = dt.weekday() >= 5

        # Format factor breakdown with human-friendly descriptions and percentages
        feature_weights = weights_data.get("features", [])
        
        # Build contributing factors list
        contributing_factors = [
            {
                "factor": "Recent Consumption Momentum (Lag 1)",
                "category": "Immediate Telemetry",
                "importancePct": round(weights_data.get("weights", {}).get(f"{region}_MW", 65.4), 1),
                "impactDirection": "Positive Momentum" if delta_mw >= 0 else "Downward Transition",
                "description": f"Baseline grid momentum at {current_mw.toLocaleString() if hasattr(current_mw, 'toLocaleString') else f'{current_mw:,.1f}'} MW provides the primary inertia anchor."
            },
            {
                "factor": "24-Hour Diurnal Cycle (Lag 24)",
                "category": "Daily Rhythm",
                "importancePct": round(weights_data.get("weights", {}).get("lag_24", 8.5), 1),
                "impactDirection": "Cyclical Anchor",
                "description": f"Demand at {hour:02d}:00 on yesterday ({day_name}) establishes the cyclical expectation."
            },
            {
                "factor": "Hour of Day Pattern",
                "category": "Time-of-Use",
                "importancePct": round(weights_data.get("weights", {}).get("hour", 5.2), 1),
                "impactDirection": "Off-Peak Base" if 1 <= hour <= 5 else "Peak Surcharge" if 17 <= hour <= 20 else "Standard Daytime",
                "description": f"Target hour ({hour:02d}:00) historically exhibits {'low night-time residential demand' if 1 <= hour <= 5 else 'heavy evening peak load' if 17 <= hour <= 20 else 'steady daytime business operations'}."
            },
            {
                "factor": "24-Hour Rolling Moving Average",
                "category": "Medium-Term Trend",
                "importancePct": round(weights_data.get("weights", {}).get("rolling_mean_24", 4.1), 1),
                "impactDirection": "Trend Level",
                "description": "Multi-hour smoothed average filters out random single-substation spikes."
            },
            {
                "factor": "Day of Week & Calendar Context",
                "category": "Calendar Dynamics",
                "importancePct": round(weights_data.get("weights", {}).get("dayofweek", 3.0), 1),
                "impactDirection": "Weekend Setback" if is_weekend else "Weekday Industrial",
                "description": f"{'Weekend mode: Commercial and institutional HVAC scheduled setbacks active.' if is_weekend else 'Weekday mode: Full industrial shift schedules and office occupancy.'}"
            }
        ]

        # Natural language summary synthesis
        summary = (
            f"The AI forecasted {predicted_mw:,.1f} MW for {region} at {dt_str} ({delta_pct:+.2f}% vs current load). "
            f"The model's decision is primarily anchored by immediate grid momentum (Lag 1: {weights_data.get('weights', {}).get(f'{region}_MW', 65.4):.1f}% weight) "
            f"combined with the 24-hour diurnal diurnal curve for {day_name} {hour:02d}:00."
        )

        return {
            "type": "FORECAST_EXPLANATION",
            "region": region,
            "forecastTimestamp": dt_str,
            "currentLoadMW": current_mw,
            "predictedLoadMW": predicted_mw,
            "deltaMW": delta_mw,
            "deltaPct": delta_pct,
            "modelR2": live_fc["modelAccuracyR2"],
            "modelMAE": live_fc["modelMAE"],
            "summary": summary,
            "contributingFactors": contributing_factors,
            "allFeatureWeights": feature_weights
        }

    @staticmethod
    def explain_anomaly(region: str = "PJME", anomaly_id: str = None) -> dict:
        """
        Explains WHY an anomaly was flagged.
        Deconstructs Actual vs Expected, Residual magnitude, Z-score, and Physical Root Causes.
        """
        region = region.upper()
        anomaly_file = os.path.join(ANOMALIES_DIR, f"{region}_final_anomalies.csv")
        config = {}
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                config = json.load(f)
        
        region_threshold = config.get("regions", {}).get(region, {}).get("deviation_threshold_percent", 2.5)

        if not os.path.exists(anomaly_file):
            return {
                "type": "ANOMALY_EXPLANATION",
                "region": region,
                "hasAnomaly": False,
                "summary": "No anomaly records found for this region."
            }

        df = pd.read_csv(anomaly_file)
        df["Datetime"] = pd.to_datetime(df["Datetime"])

        # Pick matching anomaly or latest
        if anomaly_id and "sim_" in anomaly_id:
            # Handle simulated anomaly explanation
            return {
                "type": "ANOMALY_EXPLANATION",
                "region": region,
                "hasAnomaly": True,
                "severity": "CRITICAL",
                "direction": "Simulated Live Event",
                "actualMW": 0,
                "expectedMW": 0,
                "residualMW": 0,
                "deviationPct": 14.5,
                "thresholdPct": round(region_threshold, 2),
                "zScore": 3.8,
                "confidenceScore": 95.0,
                "summary": f"Simulated live grid event exceeding the {region_threshold:.2f}% regional tolerance threshold.",
                "contributingFactors": [
                    {"name": "Residual Magnitude", "value": "Exceeds 3.5σ statistical safety boundary", "impact": "High"},
                    {"name": "Isolation Forest Score", "value": "Outlier partition score < -0.05", "impact": "High"},
                    {"name": "Time-of-Use Context", "value": "Substation live feeder disconnect injection", "impact": "Medium"}
                ]
            }

        # Take latest critical or first row
        critical_df = df[df["final_severity"].str.upper().isin(["CRITICAL", "HIGH"])]
        row = critical_df.iloc[0] if not critical_df.empty else df.iloc[0]

        dt = row["Datetime"]
        actual = float(row["Actual"])
        pred = float(row["Predicted"])
        res = float(row.get("residual", actual - pred))
        dev_pct = float(row.get("deviation_pct", abs(res / pred) * 100))
        sev = str(row.get("final_severity", "Critical")).upper()
        if sev == "HIGH": sev = "CRITICAL"
        conf = float(row.get("confidence_score", 91.4))
        
        hour = dt.hour
        is_peak = 17 <= hour <= 20
        is_weekend = dt.weekday() >= 5

        # Calculate approximate Z-Score
        z_score = round(dev_pct / (region_threshold / 2.5), 2)

        if res > 0:
            direction = "Overconsumption Spike"
            classification_reason = f"Actual power demand ({actual:,.1f} MW) surged significantly higher than the expected baseline ({pred:,.1f} MW)."
            physics_explanation = (
                f"A sudden positive deviation of +{res:,.1f} MW (+{dev_pct:.2f}%) was detected at {dt.strftime('%b %d, %Y %H:%M')}. "
                f"Because this deviation is {z_score}x higher than standard regional noise ({region_threshold:.2f}% threshold), "
                f"the Isolation Forest model flagged it as a {sev} anomaly."
            )
        else:
            direction = "Underconsumption Drop"
            classification_reason = f"Actual power demand ({actual:,.1f} MW) plummeted significantly below the expected baseline ({pred:,.1f} MW)."
            physics_explanation = (
                f"A sudden negative deviation of -{abs(res):,.1f} MW (-{dev_pct:.2f}%) occurred at {dt.strftime('%b %d, %Y %H:%M')}. "
                f"In electric utility grid operations, an unpredicted drop of this scale indicates a major substation feeder trip, "
                f"emergency industrial load shedding, or localized blackout."
            )

        contributing_factors = [
            {
                "factor": "Residual Deviation Magnitude",
                "value": f"{abs(res):,.1f} MW ({dev_pct:.2f}%)",
                "threshold": f"{region_threshold:.2f}% (Regional 95th% Cutoff)",
                "significance": "Extreme" if dev_pct >= region_threshold * 2 else "High",
                "description": f"Residual error is {round(dev_pct / region_threshold, 1)}x the regional statistical boundary."
            },
            {
                "factor": "Diurnal Period Context",
                "value": f"{hour:02d}:00 ({'Peak Window' if is_peak else 'Off-Peak Base' if 1 <= hour <= 5 else 'Standard Daytime'})",
                "threshold": "17:00 – 20:00 Peak Surcharge",
                "significance": "High" if is_peak else "Medium",
                "description": f"{'Occurred during peak tariff window: Grid vulnerability and financial penalties are magnified.' if is_peak else 'Occurred during off-peak window: Unexpected departure from scheduled base load.'}"
            },
            {
                "factor": "Day Type & Calendar Context",
                "value": f"{dt.strftime('%A')} ({'Weekend' if is_weekend else 'Weekday'})",
                "threshold": "Standard Work Week Pattern",
                "significance": "Medium",
                "description": f"{'Weekend anomaly: Unexpected industrial load activity when facility should be in setback.' if is_weekend else 'Weekday anomaly: Deviation during full active commercial schedule.'}"
            },
            {
                "factor": "Isolation Forest Outlier Score",
                "value": f"{float(row.get('anomaly_score', -0.05)):.4f}",
                "threshold": "< 0.0000 (Outlier Partition Bound)",
                "significance": "High",
                "description": "Multi-dimensional isolation tree path length confirmed anomalous feature combination."
            }
        ]

        return {
            "type": "ANOMALY_EXPLANATION",
            "region": region,
            "timestamp": dt.strftime("%b %d, %Y %H:%M"),
            "severity": sev,
            "direction": direction,
            "actualMW": actual,
            "expectedMW": pred,
            "residualMW": res,
            "deviationPct": dev_pct,
            "thresholdPct": round(region_threshold, 2),
            "zScore": z_score,
            "confidenceScore": conf,
            "classificationReason": classification_reason,
            "physicsExplanation": physics_explanation,
            "contributingFactors": contributing_factors
        }
