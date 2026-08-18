import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_1_adaptive_forecasting.router import router as forecast_router
from backend.feature_2_anomaly_detection.router import router as anomaly_router
from backend.feature_3_energy_trends.router import router as trends_router
from backend.feature_4_peak_analytics.router import router as peak_router
from backend.feature_5_historical_patterns.router import router as patterns_router
from backend.feature_6_similar_days.router import router as similar_days_router
from backend.feature_7_ai_explainability.router import router as explainability_router
from backend.feature_8_financial_cost.router import router as cost_router
from backend.feature_9_energy_health.router import router as health_router
from backend.feature_10_recommendations.router import router as recommendations_router

app = FastAPI(
    title="Smart Energy Management OS — Backend API",
    description="REST API server supporting 1-Hour Adaptive Forecasting, Anomaly Detection & Facility Analytics",
    version="1.0.0"
)

# Enable CORS for React Vite frontend (port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Feature 1: Adaptive Energy Forecasting ────────────────────────────────────
app.include_router(forecast_router, prefix="/api")

# ── Feature 2: Context-Aware Anomaly Detection ────────────────────────────────
app.include_router(anomaly_router, prefix="/api")

# ── Feature 3: Energy Usage Trends & Multiscale Aggregations ─────────────────
app.include_router(trends_router, prefix="/api")

# ── Feature 4: Peak & Off-Peak Analytics ─────────────────────────────────────
app.include_router(peak_router, prefix="/api")

# ── Feature 5: Historical Pattern Discovery ───────────────────────────────────
app.include_router(patterns_router, prefix="/api")

# ── Feature 6: Similar Day Finder ─────────────────────────────────────────────
app.include_router(similar_days_router, prefix="/api")

# ── Feature 7: AI Explainability (Forecast & Anomaly Breakdown) ───────────────
app.include_router(explainability_router, prefix="/api")

# ── Feature 8: Financial Cost Impact & Tariff Engine ──────────────────────────
app.include_router(cost_router, prefix="/api")

# ── Feature 9: AI Energy Health Scoring ──────────────────────────────────────
app.include_router(health_router, prefix="/api")

# ── Feature 10: Actionable Energy-Saving Recommendations ──────────────────────
app.include_router(recommendations_router, prefix="/api")

# ── Feature 11: RAG-Based Energy AI Copilot ──────────────────────────────────
from backend.feature_11_copilot.router import router as copilot_router
app.include_router(copilot_router, prefix="/api")

# ── Feature 12: Automated Management Energy Reports ───────────────────────────
from backend.feature_12_reporting.router import router as reporting_router
app.include_router(reporting_router, prefix="/api")


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

@app.get("/api/health-check")
def health_check():
    return {
        "status": "healthy",
        "backend": "FastAPI",
        "system": "Smart Energy Management OS",
        "version": "1.0.0"
    }

# ── Serve React Single-Page Application (SPA) ──────────────────────────────────
DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Return specific static asset if present in dist root
    potential_file = os.path.join(DIST_DIR, full_path)
    if full_path and os.path.exists(potential_file) and os.path.isfile(potential_file):
        return FileResponse(potential_file)
    
    # Fallback to index.html for React SPA client-side routing
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return {
        "status": "online",
        "system": "Smart Energy OS Backend",
        "version": "1.0.0",
        "docs": "/docs"
    }
