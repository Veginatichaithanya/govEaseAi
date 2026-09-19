from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class AIGuidanceRequest(BaseModel):
    message: Optional[str] = None
    query: Optional[str] = None
    serviceId: Optional[str] = None
    serviceContext: Optional[Dict[str, Any]] = None
    applicationContext: Optional[Dict[str, Any]] = None
    conversationHistory: Optional[List[Dict[str, Any]]] = None

class AIGuidanceResponse(BaseModel):
    success: bool
    answer: Optional[str] = None
    error: Optional[str] = None
    serviceId: Optional[str] = None
