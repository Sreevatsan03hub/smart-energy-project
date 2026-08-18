from fastapi import APIRouter, Query, HTTPException
from backend.feature_7_ai_explainability.service import ExplainabilityService

router = APIRouter(tags=["Feature 7: AI Explainability"])

@router.get("/explainability/forecast")
def explain_forecast(
    region: str = Query("PJME", description="Region code (e.g. PJME, AEP, DOM)")
):
    """
    Explains WHY the XGBoost model produced this specific 1-hour ahead forecast.
    Answers: Influential features, recent momentum, diurnal cycle, and calendar context.
    """
    try:
        return ExplainabilityService.explain_forecast(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explainability/anomaly")
def explain_anomaly(
    region: str = Query("PJME", description="Region code"),
    anomaly_id: str = Query(None, description="Optional specific anomaly event ID")
):
    """
    Explains WHY an anomaly was flagged.
    Answers: Actual vs Expected comparison, Z-score significance, and physical root-cause factors.
    """
    try:
        return ExplainabilityService.explain_anomaly(region, anomaly_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explainability")
def get_combined_explainability(
    region: str = Query("PJME", description="Region code")
):
    """
    Combined explainability endpoint returning both forecast decision weights and anomaly diagnosis.
    """
    try:
        fc = ExplainabilityService.explain_forecast(region)
        ano = ExplainabilityService.explain_anomaly(region)
        return {
            "region": region,
            "forecastExplanation": fc,
            "anomalyExplanation": ano,
            # Backward compatibility for legacy chart components
            "weights": {f["name"]: f["importance"] for f in fc.get("allFeatureWeights", [])},
            "features": fc.get("allFeatureWeights", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
