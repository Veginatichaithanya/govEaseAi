from app.schemas.auth import LoginRequest, LoginResponse, UserInfo
from app.schemas.service import ServiceResponse, DepartmentResponse
from app.schemas.application import (
    ApplicationCreateRequest,
    ApplicationUpdateRequest,
    OfficerActionRequest,
    ApplicationResponse,
    OfficerDashboardStats,
    CitizenStats,
    DocumentItemSchema
)
from app.schemas.activity import ActivityResponse
from app.schemas.notification import NotificationResponse
from app.schemas.ai import AIGuidanceRequest, AIGuidanceResponse
from app.schemas.ai_multimodal import (
    MultimodalChatRequest,
    MultimodalChatResponse,
    DocumentAnalyzeRequest,
    DocumentExtractionResponse,
    VerificationResponse,
    ApplicationSummaryRequest,
    ApplicationSummaryResponse,
    AIStatusResponse,
)

__all__ = [
    "LoginRequest",
    "LoginResponse",
    "UserInfo",
    "ServiceResponse",
    "DepartmentResponse",
    "ApplicationCreateRequest",
    "ApplicationUpdateRequest",
    "OfficerActionRequest",
    "ApplicationResponse",
    "OfficerDashboardStats",
    "CitizenStats",
    "DocumentItemSchema",
    "ActivityResponse",
    "NotificationResponse",
    "AIGuidanceRequest",
    "AIGuidanceResponse",
    "MultimodalChatRequest",
    "MultimodalChatResponse",
    "DocumentAnalyzeRequest",
    "DocumentExtractionResponse",
    "VerificationResponse",
    "ApplicationSummaryRequest",
    "ApplicationSummaryResponse",
    "AIStatusResponse",
]
