from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.feature_3_energy_trends.service import EnergyTrendsService

router = APIRouter(tags=["Feature 3: Energy Usage Trends"])

@router.get("/trends")
def get_trends(
    region: str = Query("PJME", description="Region code (e.g. PJME, AEP, DOM)"),
    interval: str = Query("daily", description="Granularity: hourly, daily, weekly, monthly"),
    start_date: Optional[str] = Query(None, description="Optional start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Optional end date (YYYY-MM-DD)"),
    limit: Optional[int] = Query(None, description="Max records to return")
):
    """
    Returns time-series consumption points aggregated by hourly, daily, weekly, or monthly intervals.
    """
    try:
        return EnergyTrendsService.get_trends(region, interval, start_date, end_date, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/summary")
def get_trends_summary(
    region: str = Query("PJME", description="Region code"),
    start_date: Optional[str] = Query(None, description="Optional start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Optional end date (YYYY-MM-DD)")
):
    """
    Returns summary KPI statistics: Total MWh, Average MW, Peak Demand, Lowest Baseload.
    """
    try:
        return EnergyTrendsService.get_trends_summary(region, start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/regions")
def list_available_regions():
    """
    Returns list of all available regional datasets.
    """
    try:
        return {"regions": EnergyTrendsService.list_regions()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
