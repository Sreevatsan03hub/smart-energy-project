from fastapi import APIRouter, Query, HTTPException
from backend.feature_2_anomaly_detection.service import AnomalyDetectionService

router = APIRouter(tags=["Feature 2: Context-Aware Anomaly Detection"])

@router.get("/anomalies")
def get_anomalies(
    region: str = Query("PJME", description="Region code (e.g. PJME, AEP, COMED)"),
    limit: int = Query(50, description="Max anomaly records to return")
):
    """
    Returns detected anomalies, residual deviations, severity classifications and root-cause context.
    """
    try:
        return AnomalyDetectionService.get_anomalies(region, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/anomalies/residuals")
def get_residual_time_series(
    region: str = Query("PJME", description="Region code"),
    hours: int = Query(48, description="Historical hours window")
):
    """
    Returns residual error curve (|Actual - Predicted|) with statistical 2.5-sigma threshold line.
    """
    try:
        return AnomalyDetectionService.get_residual_time_series(region, hours)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/peaks")
def get_peak_analytics(region: str = Query("PJME", description="Region code")):
    """
    Returns 24-hour diurnal profile highlighting peak demand vs off-peak base load (Feature 4).
    """
    try:
        return AnomalyDetectionService.get_peak_offpeak_analytics(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/anomalies/latest-critical")
def get_latest_critical_alert(region: str = Query("PJME", description="Region code")):
    """
    Returns the most recent critical anomaly event for immediate notification and audio trigger.
    """
    try:
        return AnomalyDetectionService.get_latest_critical_alert(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/anomalies/simulate")
def simulate_grid_anomaly(
    region: str = Query("PJME", description="Region code"),
    deviation_factor: float = Query(0.12, description="Simulated percentage deviation (e.g. 0.12 for +12%)"),
    anomaly_type: str = Query("SPIKE", description="SPIKE or DROP")
):
    """
    Simulates a live grid anomaly injection against the ML Isolation Forest thresholds.
    """
    try:
        return AnomalyDetectionService.simulate_anomaly(region, deviation_factor, anomaly_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
