from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.feature_10_recommendations.service import RecommendationEngineService

router = APIRouter(tags=["Feature 10: Actionable Energy-Saving Recommendations"])

@router.get("/recommendations")
def get_recommendations(
    region: str = Query("PJME", description="Region identifier code (e.g. PJME, AEP, DOM)"),
    tariff: float = Query(0.12, description="Energy tariff rate in USD per kWh")
):
    """
    Dynamically scans regional telemetry across 5 heuristic inefficiency detectors
    and returns prioritized recommendations with quantified ROI.
    """
    try:
        return RecommendationEngineService.generate_recommendations(region=region, tariff=tariff)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
