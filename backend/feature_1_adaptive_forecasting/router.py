from fastapi import APIRouter, Query, HTTPException
from backend.feature_1_adaptive_forecasting.service import ForecastingService, REGIONS_META

router = APIRouter(tags=["Feature 1: Adaptive Energy Forecasting"])

@router.get("/forecast/next-hour")
def get_next_hour_forecast(region: str = Query("PJME", description="Region code (e.g. PJME, AEP, COMED)")):
    """
    Predicts next-hour (T+1) energy consumption using the trained regional XGBoost model.
    """
    try:
        return ForecastingService.get_next_hour_forecast(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/hourly")
def get_hourly_trends(
    region: str = Query("PJME", description="Region code"),
    hours: int = Query(48, description="Number of historical hours to return")
):
    """
    Returns actual vs predicted hourly time series.
    """
    try:
        return ForecastingService.get_hourly_trends(region, hours)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explainability")
def get_explainability(region: str = Query("PJME", description="Region code")):
    """
    Returns feature importance weights for the regional XGBoost model.
    """
    try:
        return ForecastingService.get_feature_explainability(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast/benchmark")
def get_model_benchmarks():
    """
    Returns test-set accuracy metrics (R², MAE) for all 11 regional models.
    """
    return REGIONS_META
