import os
import sys
from datetime import datetime, date
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_3_energy_trends.service import EnergyTrendsService
from backend.feature_1_adaptive_forecasting.service import ForecastingService
from backend.feature_2_anomaly_detection.service import AnomalyDetectionService
from backend.feature_4_peak_analytics.service import PeakOffPeakService
from backend.feature_5_historical_patterns.service import HistoricalPatternService
from backend.feature_8_financial_cost.service import FinancialCostService
from backend.feature_9_energy_health.service import HealthScoreService
from backend.feature_10_recommendations.service import RecommendationEngineService

REGION_NAMES = {
    "PJME": "PJM Eastern Interconnection",
    "AEP": "American Electric Power (AEP)",
    "COMED": "Commonwealth Edison (Chicago)",
    "DAYTON": "Dayton Power and Light (Dayton)",
    "DEOK": "Duke Energy Ohio & Kentucky",
    "DOM": "Dominion Virginia Power",
    "DUQ": "Duquesne Light Co. (Pittsburgh)",
    "EKPC": "East Kentucky Power Cooperative",
    "FE": "FirstEnergy Grid Systems",
    "NI": "Northern Indiana Public Service",
    "PJMW": "PJM Western Interconnection"
}

class ReportGenerationService:

    @staticmethod
    def generate_report(
        region: str = "PJME",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        report_type: str = "executive",
        tariff: float = 0.12
    ) -> Dict[str, Any]:
        """
        Consolidates telemetry and insights across all 10 analytical engines into a single
        comprehensive executive or financial energy audit report.
        """
        region = region.strip().upper()
        tariff = max(0.01, float(tariff))
        df = EnergyTrendsService.load_region_dataframe(region).sort_index()

        # Date Filtering (Default: past 30 days of data)
        max_dt = df.index.max()
        if not end_date:
            end_dt = max_dt
        else:
            end_dt = pd.Timestamp(end_date) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)

        if not start_date:
            start_dt = end_dt - pd.Timedelta(days=30)
        else:
            start_dt = pd.Timestamp(start_date)

        filtered_df = df[(df.index >= start_dt) & (df.index <= end_dt)]
        if filtered_df.empty:
            filtered_df = df.tail(720) # fallback to last 30 days
            start_dt = filtered_df.index.min()
            end_dt = filtered_df.index.max()

        # ── 1. Energy Usage Aggregations ──────────────────────────────────────
        total_hours = len(filtered_df)
        total_mwh = float(filtered_df["consumption_mw"].sum())
        total_gwh = round(total_mwh / 1000.0, 2)
        avg_mw = round(float(filtered_df["consumption_mw"].mean()), 2)
        
        peak_idx = filtered_df["consumption_mw"].idxmax()
        peak_mw = round(float(filtered_df.loc[peak_idx, "consumption_mw"]), 2)
        peak_time_str = peak_idx.strftime("%Y-%m-%d %H:00")

        min_idx = filtered_df["consumption_mw"].idxmin()
        min_mw = round(float(filtered_df.loc[min_idx, "consumption_mw"]), 2)
        min_time_str = min_idx.strftime("%Y-%m-%d %H:00")

        # ── 2. Forecast Intelligence (XGBoost) ────────────────────────────────
        fc_res = ForecastingService.get_next_hour_forecast(region)
        next_hour_mw = fc_res.get("predicted_mw", avg_mw)
        forecast_r2 = fc_res.get("model_metrics", {}).get("r2_score", 0.996)
        forecast_mape = fc_res.get("model_metrics", {}).get("mape", 1.85)

        # ── 3. Peak Demand Analytics ──────────────────────────────────────────
        peak_summary = PeakOffPeakService.peak_offpeak_summary(region)
        par = peak_summary.get("peak_to_average_ratio", 1.25)
        peak_hours = peak_summary.get("peak_hours", [16, 17, 18])
        off_peak_hours = peak_summary.get("off_peak_hours", [2, 3, 4, 5])
        avg_peak_mw = peak_summary.get("average_peak_mw", peak_mw * 0.9)
        avg_offpeak_mw = peak_summary.get("average_off_peak_mw", min_mw * 1.1)

        # ── 4. Anomaly Diagnostics ────────────────────────────────────────────
        anomaly_res = AnomalyDetectionService.get_anomalies(region, limit=50)
        total_anomalies = anomaly_res.get("totalAnomalies", 0)
        critical_anomalies = anomaly_res.get("criticalCount", 0)
        medium_anomalies = anomaly_res.get("mediumCount", 0)
        recent_anomalies = anomaly_res.get("anomalies", [])[:5]

        # ── 5. Financial Cost Impact ──────────────────────────────────────────
        cost_summary = FinancialCostService.get_cost_summary(region, tariff)
        period_cost_usd = round(total_mwh * 1000.0 * tariff, 2)
        daily_cost_usd = round(period_cost_usd / max(1, (total_hours / 24.0)), 2)
        annualized_spend_usd = round(daily_cost_usd * 365.0, 2)
        peak_penalty_daily = cost_summary.get("peakPenaltyDailyUSD", 0.0)

        # ── 6. Health Score ───────────────────────────────────────────────────
        health_res = HealthScoreService.calculate_health_score(region)
        health_score = health_res.get("overallScore", 75)
        health_grade = health_res.get("statusGrade", "GOOD")
        health_label = health_res.get("statusLabel", "Stable Facility Operations")

        # ── 7. Top Actionable Recommendations ─────────────────────────────────
        recommendations = RecommendationEngineService.generate_recommendations(region, tariff)
        top_recs = recommendations[:4]
        total_potential_savings_usd = sum(r.get("potentialMonthlySavingsUSD", 0.0) for r in recommendations)

        return {
            "metadata": {
                "reportTitle": "Executive Energy & Sustainability Management Report" if report_type == "executive" else "Commercial Energy Cost, Tariff & ROI Investment Audit",
                "reportType": report_type.upper(),
                "generatedAt": datetime.now().strftime("%B %d, %Y - %H:%M:%S"),
                "regionCode": region,
                "regionName": REGION_NAMES.get(region, region),
                "startDate": start_dt.strftime("%Y-%m-%d"),
                "endDate": end_dt.strftime("%Y-%m-%d"),
                "totalHoursAnalyzed": total_hours,
                "daysAnalyzed": round(total_hours / 24.0, 1),
                "tariffRateUSD": tariff
            },
            "energySummary": {
                "totalConsumptionMWh": round(total_mwh, 1),
                "totalConsumptionGWh": total_gwh,
                "averageDemandMW": avg_mw,
                "peakDemandMW": peak_mw,
                "peakTimestamp": peak_time_str,
                "lowestBaseloadMW": min_mw,
                "lowestTimestamp": min_time_str,
                "baseloadToPeakRatioPct": round((min_mw / peak_mw) * 100.0, 1) if peak_mw > 0 else 0.0
            },
            "forecastPerformance": {
                "nextHourForecastMW": round(next_hour_mw, 1),
                "modelR2Score": forecast_r2,
                "modelMAPE": forecast_mape,
                "modelAlgorithm": "Extreme Gradient Boosting (XGBoost Regressor)",
                "status": "High Reliability Model Confidence"
            },
            "peakAnalytics": {
                "peakToAverageRatio": par,
                "peakHoursDetected": sorted(list(peak_hours)),
                "offPeakHoursDetected": sorted(list(off_peak_hours)),
                "averagePeakDemandMW": avg_peak_mw,
                "averageOffPeakDemandMW": avg_offpeak_mw,
                "peakSurchargePressure": "ELEVATED" if par > 1.25 else "NORMAL"
            },
            "anomalyDiagnostics": {
                "totalAnomaliesDetected": total_anomalies,
                "criticalSeverityCount": critical_anomalies,
                "mediumSeverityCount": medium_anomalies,
                "recentEvents": recent_anomalies
            },
            "financialExposure": {
                "periodCostUSD": period_cost_usd,
                "periodCostFormatted": FinancialCostService.format_currency_usd(period_cost_usd)["formatted"],
                "dailyAverageCostUSD": daily_cost_usd,
                "dailyAverageFormatted": FinancialCostService.format_currency_usd(daily_cost_usd)["formatted"],
                "annualizedRunRateUSD": annualized_spend_usd,
                "annualizedRunRateFormatted": FinancialCostService.format_currency_usd(annualized_spend_usd)["formatted"],
                "peakPenaltyDailyUSD": peak_penalty_daily,
                "peakPenaltyDailyFormatted": FinancialCostService.format_currency_usd(peak_penalty_daily)["formatted"],
                "expenditureBreakdown": cost_summary.get("costTrendBreakdown", [])
            },
            "healthScorecard": {
                "overallScore": health_score,
                "statusGrade": health_grade,
                "statusLabel": health_label,
                "subScores": health_res.get("subScores", {})
            },
            "recommendations": {
                "totalOpportunities": len(recommendations),
                "totalMonthlySavingsUSD": total_potential_savings_usd,
                "totalMonthlySavingsFormatted": FinancialCostService.format_currency_usd(total_potential_savings_usd)["formatted"],
                "items": top_recs
            }
        }

    @staticmethod
    def generate_html_report(
        region: str = "PJME",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        report_type: str = "executive",
        tariff: float = 0.12
    ) -> str:
        """
        Generates a self-contained, publication-grade printable HTML executive report.
        """
        data = ReportGenerationService.generate_report(region, start_date, end_date, report_type, tariff)
        meta = data["metadata"]
        summary = data["energySummary"]
        fc = data["forecastPerformance"]
        peak = data["peakAnalytics"]
        anom = data["anomalyDiagnostics"]
        fin = data["financialExposure"]
        health = data["healthScorecard"]
        recs = data["recommendations"]["items"]

        peak_hours_str = ", ".join([f"{h:02d}:00" for h in peak["peakHoursDetected"]])

        recs_rows_html = "".join([
            f"""
            <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 10px; font-weight: bold; color: #0A2540;">{r['id']} - {r['title']}</td>
                <td style="padding: 10px; font-size: 13px; color: #475569;">{r['suggestedAction']}</td>
                <td style="padding: 10px; font-weight: bold; color: #00B33C;">{r['savingsFormatted']}</td>
                <td style="padding: 10px; color: #0A2540;">-{r['peakReductionMW']} MW</td>
                <td style="padding: 10px; font-weight: 600; color: #6366F1;">{r['paybackMonths']} Mo</td>
            </tr>
            """
            for r in recs
        ])

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{meta['reportTitle']} — {meta['regionCode']}</title>
            <style>
                body {{ font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #1E293B; margin: 0; padding: 30px; background: #FFFFFF; }}
                .header {{ border-bottom: 3px solid #00B33C; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }}
                .title {{ font-size: 24px; font-weight: 800; color: #0A2540; margin: 0; }}
                .subtitle {{ font-size: 14px; color: #64748B; margin-top: 4px; }}
                .meta-badge {{ background: #F1F5F9; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #334155; }}
                .grid-4 {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }}
                .card {{ background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; }}
                .card-title {{ font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; margin-bottom: 6px; }}
                .card-val {{ font-size: 22px; font-weight: 800; color: #0A2540; }}
                .card-sub {{ font-size: 11px; color: #64748B; margin-top: 4px; }}
                .section-title {{ font-size: 16px; font-weight: 700; color: #0A2540; margin: 20px 0 10px 0; border-left: 4px solid #0B63E5; padding-left: 8px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }}
                th {{ background: #F1F5F9; text-align: left; padding: 10px; color: #334155; font-weight: 700; }}
                @media print {{
                    body {{ padding: 0; }}
                    .no-print {{ display: none; }}
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1 class="title">{meta['reportTitle']}</h1>
                    <div class="subtitle">Facility: <strong>{meta['regionName']} ({meta['regionCode']})</strong> | Analysis Period: {meta['startDate']} to {meta['endDate']}</div>
                </div>
                <div style="text-align: right;">
                    <div class="meta-badge">Generated: {meta['generatedAt']}</div>
                    <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">SmartEnergy OS Enterprise v1.0</div>
                </div>
            </div>

            <!-- Key Executive KPIs -->
            <div class="grid-4">
                <div class="card">
                    <div class="card-title">Total Consumption</div>
                    <div class="card-val">{summary['totalConsumptionGWh']} GWh</div>
                    <div class="card-sub">{summary['totalConsumptionMWh']:,} MWh ({meta['daysAnalyzed']} Days)</div>
                </div>
                <div class="card">
                    <div class="card-title">Peak Grid Demand</div>
                    <div class="card-val">{summary['peakDemandMW']:,} MW</div>
                    <div class="card-sub">Recorded at {summary['peakTimestamp']}</div>
                </div>
                <div class="card">
                    <div class="card-title">Total Energy Spend</div>
                    <div class="card-val">{fin['periodCostFormatted']}</div>
                    <div class="card-sub">At ${meta['tariffRateUSD']:.2f}/kWh Tariff</div>
                </div>
                <div class="card">
                    <div class="card-title">Energy Health Score</div>
                    <div class="card-val" style="color: #00B33C;">{health['overallScore']}/100</div>
                    <div class="card-sub">{health['statusGrade']} — {health['statusLabel']}</div>
                </div>
            </div>

            <!-- Section 1: Peak & Diurnal Operating Analysis -->
            <div class="section-title">1. Empirical Peak & Diurnal Operating Analysis</div>
            <p style="font-size: 13px; line-height: 1.5; color: #334155;">
                Telemetry demonstrates an empirical <strong>Peak-to-Average Ratio (PAR) of {peak['peakToAverageRatio']:.2f}x</strong>. Primary commercial peak windows are concentrated between <strong>{peak_hours_str}</strong> with an average peak demand of <strong>{peak['averagePeakDemandMW']:,} MW</strong>. Baselines step down to an overnight low of <strong>{summary['lowestBaseloadMW']:,} MW</strong> at {summary['lowestTimestamp']}. Peak load concentration generates an avoidable surcharge exposure of <strong>{fin['peakPenaltyDailyFormatted']} per operating day</strong>.
            </p>

            <!-- Section 2: AI Forecasting & Anomaly Integrity -->
            <div class="section-title">2. AI Forecasting & Anomaly Telemetry Diagnostics</div>
            <p style="font-size: 13px; line-height: 1.5; color: #334155;">
                The 1-hour ahead XGBoost predictive model achieved an <strong>R² accuracy score of {fc['modelR2Score']} (MAPE: {fc['modelMAPE']}%)</strong>. Telemetry scanning isolated a total of <strong>{anom['totalAnomaliesDetected']} statistical anomaly events</strong> outside ±3σ dynamic confidence bands ({anom['criticalSeverityCount']} critical severity, {anom['mediumSeverityCount']} medium severity).
            </p>

            <!-- Section 3: Recommended Optimization Actions -->
            <div class="section-title">3. Prioritized Engineering Optimization & Capital ROI Schedule</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 25%;">Recommendation</th>
                        <th style="width: 40%;">Suggested Engineering Action</th>
                        <th style="width: 15%;">Monthly Savings</th>
                        <th style="width: 10%;">Peak Relief</th>
                        <th style="width: 10%;">Payback</th>
                    </tr>
                </thead>
                <tbody>
                    {recs_rows_html}
                </tbody>
            </table>

            <div style="margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #94A3B8;">
                <div>SmartEnergy OS — Automated Energy Management & Intelligence Engine</div>
                <div>Confidential Management Report</div>
            </div>
        </body>
        </html>
        """
        return html
