from app.routers.auth import router as auth_router
from app.routers.services import router as services_router
from app.routers.applications import router as applications_router
from app.routers.officer import router as officer_router
from app.routers.documents import router as documents_router
from app.routers.notifications import router as notifications_router
from app.routers.ai import router as ai_router
from app.routers.profile import router as profile_router
from app.routers.admin import router as admin_router
from app.routers.government_auth import router as government_auth_router

__all__ = [
    "auth_router",
    "services_router",
    "applications_router",
    "officer_router",
    "documents_router",
    "notifications_router",
    "ai_router",
    "profile_router",
    "admin_router",
    "government_auth_router"
]
