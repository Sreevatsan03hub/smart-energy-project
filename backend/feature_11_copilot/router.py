import os
import sys
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_11_copilot.service import CopilotService

router = APIRouter(prefix="/chatbot", tags=["Feature 11: RAG-Based Energy AI Copilot"])


class ChatQueryRequest(BaseModel):
    question: str = Field(..., description="User question or query string")
    region: Optional[str] = Field("PJME", description="Active regional grid code (e.g. PJME, AEP, COMED)")
    user_role: Optional[str] = Field("admin", description="Operator role: 'admin' or 'regional_user'")
    assigned_region: Optional[str] = Field("ALL", description="Authorized region: 'ALL' or specific region like 'AEP'")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(default=[], description="Recent multi-turn messages")


@router.post("/query")
def process_chat_query(req: ChatQueryRequest):
    """
    RAG conversational interface for grid dispatchers, operators, and facility executives.
    Enforces RBAC security, structured data retrieval, semantic knowledge lookup, and grounded response synthesis.
    """
    try:
        response = CopilotService.process_query(
            question=req.question,
            active_region=req.region or "PJME",
            user_role=req.user_role,
            assigned_region=req.assigned_region,
            conversation_history=req.conversation_history
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot processing error: {str(e)}")


@router.get("/connectivity")
def get_system_connectivity(region: str = Query("PJME", description="Region code")):
    """
    Returns structured graph nodes and edges representing the complete ML & telemetry pipeline.
    """
    try:
        return CopilotService._handle_connectivity(region)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge")
def get_knowledge_topics():
    """
    Lists indexed knowledge base documents.
    """
    return {
        "indexed_topics": list(CopilotService.semantic_retriever.documents.keys()),
        "status": "ready"
    }
