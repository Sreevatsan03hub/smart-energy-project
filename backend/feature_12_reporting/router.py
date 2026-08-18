from fastapi import APIRouter, Query, HTTPException, Response
from typing import Optional
from backend.feature_12_reporting.service import ReportGenerationService

router = APIRouter(tags=["Feature 12: Automated Management Energy Reports"])

@router.get("/reports/generate")
def generate_report(
    region: str = Query("PJME", description="Region code (e.g. PJME, AEP, DOM)"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    report_type: str = Query("executive", description="executive or financial"),
    tariff: float = Query(0.12, description="Electricity tariff rate in USD/kWh")
):
    """
    Consolidates usage, peaks, forecasts, anomalies, costs, health score, and recommendations into one management report.
    """
    try:
        return ReportGenerationService.generate_report(
            region=region,
            start_date=start_date,
            end_date=end_date,
            report_type=report_type,
            tariff=tariff
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/download-html")
def download_html_report(
    region: str = Query("PJME", description="Region code"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    report_type: str = Query("executive", description="executive or financial"),
    tariff: float = Query(0.12, description="Electricity tariff rate in USD/kWh")
):
    """
    Returns a publication-grade printable HTML executive report.
    """
    try:
        html_content = ReportGenerationService.generate_html_report(
            region=region,
            start_date=start_date,
            end_date=end_date,
            report_type=report_type,
            tariff=tariff
        )
        return Response(content=html_content, media_type="text/html")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
