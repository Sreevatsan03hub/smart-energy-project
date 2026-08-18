# Smart Energy OS — System Connectivity & Architecture

## End-to-End System Pipeline & Connectivity

The Smart Energy OS integrates data ingestion, machine learning inference, statistical diagnostics, and automated decision-making into a unified, modular architecture:

```
[ Historical PJM Telemetry ]
            │
            ▼
[ Automated Feature Extraction ] ── (Lags 1, 2, 3, 24, 48, 168 + Rolling Means/Stds)
            │
            ▼
[ Adaptive XGBoost Forecaster ] ── (Predicts Expected T+1 Demand)
            │
            ▼
[ Actual vs Forecast Comparator ] ── (Calculates Residual e = Actual - Predicted)
            │
            ▼
[ Isolation Forest Anomaly Core ] ── (Evaluates Residual + Volatility Vectors)
            │
            ├────────────────────────┐
            ▼                        ▼
[ Historical Pattern Engine ]  [ Financial Tariff Engine ]
 (Hourly/Daily/Monthly Shifts)   (ToU & Demand Surcharges)
            │                        │
            └───────────┬────────────┘
                        ▼
         [ AI Energy Health Scoring ] (0-100 Composite EHS)
                        │
                        ▼
      [ Actionable Recommendations Engine ]
 (Peak Shifting, BESS Arbitrage, Maintenance)
                        │
                        ▼
        [ RAG-Based Energy AI Copilot ] (Unified Operator Interface)
```

## Step-by-Step Pipeline Mechanics

1. **Telemetry Ingestion**: Real-time hourly load data ($MW$) is ingested from regional substations and cleaned (handling missing timestamps, daylight savings shifts).
2. **Feature Engineering**: At time $T$, a 16-dimensional feature vector is generated using autoregressive lags ($T, T-1, T-2, T-24, T-48, T-168$) and rolling 24h/168h statistics.
3. **Adaptive Forecasting**: The regional XGBoost regressor predicts expected demand $\hat{y}_{T+1}$ with $R^2 > 0.995$ accuracy.
4. **Context-Aware Anomaly Detection**: When actual telemetry $y$ arrives, the residual $e = y - \hat{y}$ is scored by the regional Isolation Forest model against dynamic 95th percentile deviation thresholds.
5. **Historical Pattern Verification**: The current load profile is cross-referenced with multi-year diurnal baselines and cosine similar days.
6. **Financial Cost & Tariff Modeling**: Megawatt-hours are converted to dollar expenditures under flat and Time-of-Use (ToU) tariff rates, quantifying peak demand penalties.
7. **Health Index Scoring**: The facility's composite 0–100 Energy Health Score is computed across 4 pillars (anomaly density, peak stress, forecast tracking variance, volatility).
8. **Recommendation Generation**: Rule-based optimization engines generate concrete, prioritized load-shifting and maintenance actions.
9. **Copilot RAG Layer**: Serves as the natural language conversational interface for dispatchers and executives.
