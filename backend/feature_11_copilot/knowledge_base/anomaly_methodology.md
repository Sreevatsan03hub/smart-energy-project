# Anomaly Detection Methodology & Isolation Forest

## Overview
The Smart Energy Management OS employs a dual-stage, context-aware anomaly detection architecture combining **Isolation Forest Machine Learning** with **Dynamic Residual Thresholding** across all 11 PJM regions.

## Model Selection Rationale: Why Isolation Forest?
1. **Unsupervised Outlier Isolation**: Grid anomalies (equipment failures, unexpected industrial load surges, storm outages) are rare and unlabelled in historical telemetry. Isolation Forest isolates anomalies by randomly partitioning feature dimensions without requiring pre-labelled ground truth.
2. **Sub-linear Complexity & Scalability**: Isolation Forest builds randomized decision trees with $O(n \log n)$ time complexity, making it computationally light for real-time edge processing.
3. **Multi-dimensional Residual Space**: Rather than flagging anomalies purely on raw megawatt values (which would false-alarm on legitimate hot summer afternoon peaks), the model operates in the multi-dimensional residual space of XGBoost forecasting errors and rolling volatilities.

## Hyperparameters & Feature Configuration
Configured in `models/anomaly/anomaly_config.json`:
- `model_type`: `IsolationForest`
- `n_estimators`: 200 trees
- `contamination`: 0.05 (5% expected anomaly rate)
- `random_state`: 42

Feature vector for anomaly scoring:
1. `residual`: Actual load minus predicted load ($y - \hat{y}$).
2. `deviation_pct`: Percentage error $|y - \hat{y}| / \hat{y} \times 100$.
3. `residual_rolling_mean_24h`: 24-hour moving average of residuals.
4. `residual_rolling_std_24h`: 24-hour moving volatility of residuals.
5. `load_rolling_mean_24h`: 24-hour moving average load.
6. `load_rolling_std_24h`: 24-hour moving load volatility.
7. `hour`: Hour of day (0–23).
8. `day_of_week`: Day of week (0–6).
9. `month`: Month of year (1–12).
10. `is_weekend`: Weekend indicator flag (0/1).

## 95th Percentile Deviation Thresholds by Region
- **AEP**: 2.09% deviation threshold
- **COMED**: 2.12% deviation threshold
- **DAYTON**: 2.27% deviation threshold
- **DEOK**: 2.58% deviation threshold
- **DOM**: 2.46% deviation threshold
- **DUQ**: 3.04% deviation threshold
- **EKPC**: 5.03% deviation threshold
- **FE**: 2.06% deviation threshold
- **NI**: 2.19% deviation threshold
- **PJME**: 2.23% deviation threshold
- **PJMW**: 2.42% deviation threshold

## Severity Classification Taxonomy
- **CRITICAL**: Deviation $\ge 3.0 \times$ regional threshold or sudden load divergence $>15\%$. Requires immediate dispatcher intervention.
- **HIGH**: Deviation between $2.0 \times$ and $3.0 \times$ regional threshold.
- **MEDIUM**: Deviation between $1.0 \times$ and $2.0 \times$ regional threshold.
- **LOW**: Sub-threshold operational variance with elevated rolling volatility.
