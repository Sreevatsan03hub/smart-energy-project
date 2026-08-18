# Energy-Saving Recommendations & Strategic Action Engine

## Overview
The Recommendation Engine scans regional telemetry across 5 automated inefficiency detectors to produce prioritized, evidence-backed engineering interventions.

## Five Inefficiency Detectors

### Detector 1: Diurnal Peak Load Shifting & Pre-Cooling
- **Trigger**: Peak-to-Average Ratio ($\text{PAR}) \ge 1.10$.
- **Action**: Shift 8% of peak MW into pre-dawn off-peak hours (02:00–05:00) using thermal storage or precooling commercial spaces.
- **Financial Impact**: Eliminates steep Time-of-Use (ToU) demand surcharges.

### Detector 2: Basal Overnight Standby & Weekend Curtailment
- **Trigger**: Weekend or overnight baseload $> 70\%$ of weekday peak.
- **Action**: Implement automated setback controls on non-critical HVAC air handling units and lighting controllers.

### Detector 3: Anomaly Remediation & Predictive Equipment Maintenance
- **Trigger**: High or Critical anomaly count $\ge 3$ within recent monitoring windows.
- **Action**: Dispatch inspection crews for equipment miscalibration, phase imbalances, or stuck chiller dampers.

### Detector 4: Battery Energy Storage System (BESS) Peak Arbitrage
- **Trigger**: High peak-to-trough cost spreads.
- **Action**: Charge stationary battery storage during 03:00–06:00 low-tariff windows; discharge during 17:00–20:00 peak grid stress.

### Detector 5: Power Factor & Reactive Power Optimization
- **Trigger**: High variance in baseline reactive power.
- **Action**: Install or tune capacitor banks to maintain power factor above 0.95 and avoid utility kVAr penalties.

## Horizon Grounding Policy (Short-Term vs Long-Term)
- **Short-Term Actions (1–7 Days)**: Grounded directly in live XGBoost $T+1$ forecasts, active anomaly alarms, and immediate peak windows.
- **Long-Term Strategic Actions (1–2 Years)**: Grounded in historical seasonal trend data, multi-year capacity growth rates, and structural tariff rate schedules. The Copilot must explicitly state that long-term strategic plans represent structural optimizations rather than 2-year forward machine learning forecasts.
