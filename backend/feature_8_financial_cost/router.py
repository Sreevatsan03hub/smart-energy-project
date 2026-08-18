from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.feature_8_financial_cost.service import FinancialCostService

router = APIRouter(tags=["Feature 8: Energy Cost Impact Analysis"])

@router.get("/cost")
@router.get("/cost/summary")
def get_cost_summary(
    region: str = Query("PJME", description="Region code (e.g. PJME, AEP, DOM)"),
    tariff: float = Query(0.12, description="Energy tariff rate in USD per kWh (default $0.12/kWh)")
):
    """
    Calculates Today's Cost, This Week's Cost, This Month's Cost, and Projected Financial Run-Rate in USD.
    """
    try:
        return FinancialCostService.get_cost_summary(region=region, tariff=tariff)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cost/trends")
def get_cost_trends(
    region: str = Query("PJME", description="Region code"),
    tariff: float = Query(0.12, description="Tariff in USD/kWh"),
    interval: str = Query("daily", description="hourly, daily, weekly, or monthly"),
    limit: Optional[int] = Query(30, description="Number of points to return")
):
    """
    Returns resampled multi-scale financial time-series for cost trend charts in USD.
    """
    try:
        return FinancialCostService.get_cost_trends(region=region, tariff=tariff, interval=interval, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
