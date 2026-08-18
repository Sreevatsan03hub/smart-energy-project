from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.feature_5_historical_patterns.service import HistoricalPatternService

router = APIRouter(tags=["Feature 5: Historical Pattern Discovery"])

@router.get("/patterns/hourly")
def get_hourly_pattern(region: str = Query("PJME", description="Region code (e.g. PJME, AEP, DOM)")):
    """
    Returns 24-hour diurnal baseline curve (00:00 to 23:00) with 1-sigma variation bands.
    """
    try:
        return HistoricalPatternService.get_hourly_pattern(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patterns/daily")
def get_daily_pattern(region: str = Query("PJME", description="Region code")):
    """
    Returns 7-day weekly profile (Monday through Sunday).
    """
    try:
        return HistoricalPatternService.get_daily_pattern(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patterns/monthly")
def get_monthly_pattern(region: str = Query("PJME", description="Region code")):
    """
    Returns 12-month seasonal macro cycles (January through December).
    """
    try:
        return HistoricalPatternService.get_monthly_pattern(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patterns/weekday-weekend")
def get_weekday_weekend_pattern(region: str = Query("PJME", description="Region code")):
    """
    Returns Weekday vs Weekend comparative split.
    """
    try:
        return HistoricalPatternService.get_weekday_weekend_pattern(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patterns/summary")
def get_pattern_summary(region: str = Query("PJME", description="Region code")):
    """
    Returns synthesized executive summary of all discovered historical patterns for a region.
    """
    try:
        return HistoricalPatternService.get_pattern_summary(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patterns/overview")
def get_all_regions_overview():
    """
    Returns cross-regional pattern summary across all 11 grids.
    """
    try:
        return {"regions": HistoricalPatternService.get_all_regions_summary()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
