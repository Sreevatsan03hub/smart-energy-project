import pandas as pd
import numpy as np
import joblib
import os

# ─────────────────────────────────────────────
# MODEL PATHS — matches your actual project
# ─────────────────────────────────────────────

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

MODEL_PATHS = {
    "AEP":    os.path.join(BASE_DIR, "models", "xgboost_AEP_model.pkl"),
    "PJME":   os.path.join(BASE_DIR, "models", "xgboost_forecasting_model.pkl"),
    "COMED":  os.path.join(BASE_DIR, "models", "regional", "COMED_xgboost_forecasting_model.pkl"),
    "DAYTON": os.path.join(BASE_DIR, "models", "regional", "DAYTON_xgboost_forecasting_model.pkl"),
    "DEOK":   os.path.join(BASE_DIR, "models", "regional", "DEOK_xgboost_forecasting_model.pkl"),
    "DOM":    os.path.join(BASE_DIR, "models", "regional", "DOM_xgboost_forecasting_model.pkl"),
    "DUQ":    os.path.join(BASE_DIR, "models", "regional", "DUQ_xgboost_forecasting_model.pkl"),
    "EKPC":   os.path.join(BASE_DIR, "models", "regional", "EKPC_xgboost_forecasting_model.pkl"),
    "FE":     os.path.join(BASE_DIR, "models", "regional", "FE_xgboost_forecasting_model.pkl"),
    "NI":     os.path.join(BASE_DIR, "models", "regional", "NI_xgboost_forecasting_model.pkl"),
    "PJMW":   os.path.join(BASE_DIR, "models", "regional", "PJMW_xgboost_forecasting_model.pkl"),
}

# ─────────────────────────────────────────────
# EXACT feature order — must match training
# ─────────────────────────────────────────────

FEATURE_COLS = [
    "{region}_MW",
    "hour",
    "day",
    "day_of_week",
    "month",
    "year",
    "is_weekend",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_24",
    "lag_48",
    "lag_168",
    "rolling_mean_24",
    "rolling_std_24",
    "rolling_mean_168",
]


def forecast_next_hour(region: str, history_df: pd.DataFrame) -> dict:
    """
    Predict energy consumption for the next hour (T+1)
    using only data available at the latest timestamp T.

    Parameters:
    -----------
    region     : str  — e.g. "AEP", "COMED", "PJME"
    history_df : pd.DataFrame — must contain columns:
                 ['Datetime', '<REGION>_MW']
                 sorted chronologically, no future rows

    Returns:
    --------
    dict with keys:
        region, source_timestamp, forecast_timestamp, predicted_energy_MW
    """

    region = region.upper()
    energy_col = f"{region}_MW"

    # ── Validate inputs ──────────────────────
    if region not in MODEL_PATHS:
        raise ValueError(f"Unknown region: {region}. Available: {list(MODEL_PATHS.keys())}")

    if energy_col not in history_df.columns:
        raise ValueError(f"Column '{energy_col}' not found in history_df.")

    if "Datetime" not in history_df.columns:
        raise ValueError("history_df must have a 'Datetime' column.")

    # ── Prepare history ──────────────────────
    df = history_df[["Datetime", energy_col]].copy()
    df["Datetime"] = pd.to_datetime(df["Datetime"])
    df = df.sort_values("Datetime").reset_index(drop=True)

    # We need at least 168 rows for lag_168 + rolling
    if len(df) < 170:
        raise ValueError(
            f"Need at least 170 rows of history. Got {len(df)}."
        )

    # ── Source timestamp T ───────────────────
    source_ts = df["Datetime"].iloc[-1]
    forecast_ts = source_ts + pd.Timedelta(hours=1)

    # ── Build features AT timestamp T ────────
    # Calendar features for the FORECAST time (T+1)
    # (hour/day/etc. of when we're predicting, not current time)
    hour       = forecast_ts.hour
    day        = forecast_ts.day
    day_of_week = forecast_ts.dayofweek
    month      = forecast_ts.month
    year       = forecast_ts.year
    is_weekend = int(day_of_week >= 5)

    # ── Lag features (look backward from T) ──
    vals = df[energy_col].values  # all values up to T

    # Current value at T = vals[-1]
    current_mw = vals[-1]

    lag_1   = vals[-1]    # T+0 (most recent known)
    lag_2   = vals[-2]    # T-1
    lag_3   = vals[-3]    # T-2
    lag_24  = vals[-24]   # ~24 hours ago
    lag_48  = vals[-48]   # ~48 hours ago
    lag_168 = vals[-168]  # ~1 week ago

    # ── Rolling features (past 24/168 hours before T) ──
    # Same as training: shift(1) then rolling → uses vals up to T-1
    rolling_window_24  = vals[-25:-1]   # 24 values ending at T-1
    rolling_window_168 = vals[-169:-1]  # 168 values ending at T-1

    rolling_mean_24  = float(np.mean(rolling_window_24))
    rolling_std_24   = float(np.std(rolling_window_24, ddof=1))
    rolling_mean_168 = float(np.mean(rolling_window_168))

    # ── Construct feature vector ─────────────
    feature_vector = pd.DataFrame([{
        energy_col:         current_mw,
        "hour":             hour,
        "day":              day,
        "day_of_week":      day_of_week,
        "month":            month,
        "year":             year,
        "is_weekend":       is_weekend,
        "lag_1":            lag_1,
        "lag_2":            lag_2,
        "lag_3":            lag_3,
        "lag_24":           lag_24,
        "lag_48":           lag_48,
        "lag_168":          lag_168,
        "rolling_mean_24":  rolling_mean_24,
        "rolling_std_24":   rolling_std_24,
        "rolling_mean_168": rolling_mean_168,
    }])

    # ── Load model and predict ────────────────
    model = joblib.load(MODEL_PATHS[region])
    predicted_mw = float(model.predict(feature_vector)[0])

    return {
        "region":               region,
        "source_timestamp":     str(source_ts),
        "forecast_timestamp":   str(forecast_ts),
        "predicted_energy_MW":  round(predicted_mw, 3),
    }
