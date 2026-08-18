# pyrefly: ignore [missing-import]


from fastapi import APIRouter, Query, HTTPException
from backend.feature_9_energy_health.service import HealthScoreService

router = APIRouter(tags=["Feature 9: Energy Health Score"])

@router.get("/health")
def get_energy_health_score(
    region: str = Query("PJME", description="Region code (e.g. PJME, AEP, DOM, DUQ)")
):
    """
    Returns the composite 0-100 Energy Health Score (EHS), 5 normalized sub-scores,
    performance grade (A+, A, B, C), positive operational highlights, and risk factors.
    """
    try:
        return HealthScoreService.calculate_health_score(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
