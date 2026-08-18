import os
import pandas as pd
import numpy as np

# Project folders
BASE = os.path.dirname(os.path.abspath(__file__))

PREDICTIONS = os.path.join(
    BASE, "data", "processed", "predictions"
)

ANOMALIES = os.path.join(
    BASE, "data", "processed", "anomalies"
)

regions = [
    "AEP", "COMED", "DAYTON", "DEOK", "DOM",
    "DUQ", "EKPC", "FE", "NI", "PJME", "PJMW"
]

passed = 0

for region in regions:

    print("\n" + "=" * 60)
    print(region)
    print("=" * 60)

    pred_file = os.path.join(
        PREDICTIONS,
        f"{region}_predictions.csv"
    )

    anomaly_file = os.path.join(
        ANOMALIES,
        f"{region}_final_anomalies.csv"
    )

    if not os.path.exists(pred_file):
        print("❌ Prediction file missing")
        continue

    if not os.path.exists(anomaly_file):
        print("❌ Anomaly file missing")
        continue

    predictions = pd.read_csv(pred_file)
    anomalies = pd.read_csv(anomaly_file)

    # Find Actual column
    if "Actual" in predictions.columns:
        actual_col = "Actual"
    elif f"{region}_MW" in predictions.columns:
        actual_col = f"{region}_MW"
    else:
        print("❌ Actual column not found")
        continue

    # Calculate prediction error
    predictions["deviation_pct"] = (
        (predictions[actual_col] - predictions["Predicted"]).abs()
        / predictions["Predicted"].abs()
    ) * 100

    predictions = predictions.replace(
        [np.inf, -np.inf], np.nan
    ).dropna(subset=["deviation_pct"])

    # 95% threshold
    threshold = predictions["deviation_pct"].quantile(0.95)

    # Basic checks
    anomalies_above_threshold = (
        anomalies["deviation_pct"].min() >= threshold
    )

    overall_mean = predictions["deviation_pct"].mean()
    anomaly_mean = anomalies["deviation_pct"].mean()

    anomaly_separation = anomaly_mean / overall_mean

    separation_ok = anomaly_separation >= 2

    max_ok = (
        abs(
            anomalies["deviation_pct"].max()
            - predictions["deviation_pct"].max()
        ) < 0.000001
    )

    result = (
        anomalies_above_threshold
        and separation_ok
        and max_ok
    )

    print("Prediction rows:", len(predictions))
    print("Detected anomalies:", len(anomalies))
    print(f"95% threshold: {threshold:.3f}%")
    print(f"Normal mean deviation: {overall_mean:.3f}%")
    print(f"Anomaly mean deviation: {anomaly_mean:.3f}%")
    print(f"Separation: {anomaly_separation:.2f}x")

    if result:
        print("✅ PASS")
        passed += 1
    else:
        print("❌ FAIL")


print("\n" + "=" * 60)
print("FINAL RESULT")
print("=" * 60)

print(f"Regions passed: {passed}/{len(regions)}")

if passed == len(regions):
    print("✅ ALL 11 REGIONS PASSED")
else:
    print("⚠️ SOME REGIONS NEED CHECKING")