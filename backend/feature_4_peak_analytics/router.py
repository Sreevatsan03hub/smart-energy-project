from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.feature_4_peak_analytics.service import PeakOffPeakService

router = APIRouter(tags=["Feature 4: Peak & Off-Peak Analytics"])

@router.get("/peak-offpeak/hourly")
def get_peak_offpeak_hourly(
    region: str = Query("PJME", description="Region code (e.g. PJME, AEP, DOM)"),
    start_date: Optional[str] = Query(None, description="Optional start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Optional end date (YYYY-MM-DD)"),
    peak_percentile: float = Query(75.0, gt=0, lt=100, description="Percentile threshold for peak (default 75)"),
    off_peak_percentile: float = Query(25.0, gt=0, lt=100, description="Percentile threshold for off-peak (default 25)")
):
    """
    Returns 24-hour diurnal load curve with peak / mid_range / off_peak classification.
    """
    try:
        return PeakOffPeakService.hourly_profile(region, start_date, end_date, peak_percentile, off_peak_percentile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/peak-offpeak/summary")
def get_peak_offpeak_summary(
    region: str = Query("PJME", description="Region code"),
    start_date: Optional[str] = Query(None, description="Optional start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Optional end date (YYYY-MM-DD)"),
    peak_percentile: float = Query(75.0, gt=0, lt=100),
    off_peak_percentile: float = Query(25.0, gt=0, lt=100)
):
    """
    Returns KPI summary of peak window, off-peak base window, average peak MW, and peak-to-average ratio.
    """
    try:
        return PeakOffPeakService.peak_offpeak_summary(region, start_date, end_date, peak_percentile, off_peak_percentile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/peak-offpeak/weekday")
def get_peak_offpeak_weekday(
    region: str = Query("PJME", description="Region code"),
    start_date: Optional[str] = Query(None, description="Optional start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Optional end date (YYYY-MM-DD)")
):
    """
    Returns consumption averages by day of week (Monday to Sunday).
    """
    try:
        return PeakOffPeakService.weekday_profile(region, start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/peak-offpeak/monthly")
def get_peak_offpeak_monthly(
    region: str = Query("PJME", description="Region code"),
    start_date: Optional[str] = Query(None, description="Optional start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Optional end date (YYYY-MM-DD)")
):
    """
    Returns consumption averages by calendar month (January to December).
    """
    try:
        return PeakOffPeakService.monthly_profile(region, start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
