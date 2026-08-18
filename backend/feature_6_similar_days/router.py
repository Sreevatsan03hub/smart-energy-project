from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.feature_6_similar_days.service import SimilarDayService

router = APIRouter(tags=["Feature 6: Similar Day Finder"])

@router.get("/similar-days")
def get_similar_days(
    region: str = Query("PJME", description="Region code (e.g. PJME, AEP, DOM, PJMW)"),
    date: Optional[str] = Query("Today", description="Target date (YYYY-MM-DD or 'Today')"),
    top_n: int = Query(5, description="Number of top matches to return"),
    same_weekday: bool = Query(True, description="Whether to filter by same day of week")
):
    """
    Finds historical days whose 24-hour normalized consumption curves match the target day.
    """
    try:
        return SimilarDayService.find_similar_days(region, date, top_n, same_weekday)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/similar-days/available-dates")
def get_available_dates(region: str = Query("PJME", description="Region code")):
    """
    Returns list of complete 24-hour calendar dates available for comparison.
    """
    try:
        return {"dates": SimilarDayService.get_available_dates(region)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
