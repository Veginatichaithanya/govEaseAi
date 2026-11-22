"""
Government Officer Authentication Router
POST /api/government/login   — Role-based login for all 7 officer types
GET  /api/government/me      — Return current officer profile
"""
from datetime import timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.officer import Officer
from app.services.auth_service import verify_password, create_access_token

router = APIRouter(prefix="/api/government", tags=["Government Officer Auth"])

# ── Role Configuration ──────────────────────────────────────────────────────

ROLE_DISPLAY_NAMES = {
    "SUPER_ADMIN": "Super Admin",
    "LICENSING_OFFICER": "Licensing Officer",
    "BUILDING_OFFICER": "Building Officer",
    "INDUSTRY_OFFICER": "Industry Officer",
    "ENVIRONMENT_OFFICER": "Environment Officer",
    "HEALTH_OFFICER": "Health Officer",
    "REVENUE_OFFICER": "Revenue Officer",
}

ROLE_DASHBOARD_ROUTES = {
    "SUPER_ADMIN": "/government/admin-dashboard",
    "LICENSING_OFFICER": "/government/licensing-dashboard",
    "BUILDING_OFFICER": "/government/building-dashboard",
    "INDUSTRY_OFFICER": "/government/industry-dashboard",
    "ENVIRONMENT_OFFICER": "/government/environment-dashboard",
    "HEALTH_OFFICER": "/government/health-dashboard",
    "REVENUE_OFFICER": "/government/revenue-dashboard",
}

# Services visible to each role
ROLE_SERVICE_IDS = {
    "SUPER_ADMIN": [
        "trade-license", "shop-registration", "business-license",
        "building-permission", "factory-registration", "pollution-certificate"
    ],
    "LICENSING_OFFICER": ["trade-license", "shop-registration"],
    "BUILDING_OFFICER": ["building-permission"],
    "INDUSTRY_OFFICER": ["factory-registration", "business-license"],
    "ENVIRONMENT_OFFICER": ["pollution-certificate"],
    "HEALTH_OFFICER": [],
    "REVENUE_OFFICER": [],
}

ALL_OFFICER_PERMISSIONS = [
    "VIEW_APPLICATIONS",
    "VIEW_DOCUMENTS",
    "REVIEW_APPLICATION",
    "REQUEST_CORRECTION",
    "REJECT_APPLICATION",
    "APPROVE_APPLICATION",
    "ISSUE_DIGITAL_LICENSE",
]

SUPER_ADMIN_PERMISSIONS = ALL_OFFICER_PERMISSIONS + [
    "MANAGE_OFFICERS",
    "VIEW_ALL_DEPARTMENTS",
    "VIEW_ANALYTICS",
]


# ── Request / Response Schemas ──────────────────────────────────────────────

class GovernmentLoginRequest(BaseModel):
    email: str
    password: str
    rememberMe: Optional[bool] = False


class GovernmentOfficerInfo(BaseModel):
    id: str
    fullName: str
    email: str
    role: str
    roleDisplayName: str
    department: Optional[str] = None
    designation: Optional[str] = None
    mobile: Optional[str] = None
    dashboardRoute: str
    serviceIds: List[str]
    permissions: List[str]


class GovernmentLoginResponse(BaseModel):
    success: bool
    token: str
    officer: GovernmentOfficerInfo


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/login", response_model=GovernmentLoginResponse)
def government_login(req: GovernmentLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a government officer by email + password.
    Returns a JWT token with role, department, and dashboard_route encoded.
    Token expiry: 8 hours standard, 30 days if rememberMe is true.
    """
    email = req.email.strip().lower()
    officer = db.query(Officer).filter(Officer.email.ilike(email)).first()

    if not officer or not verify_password(req.password, officer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not officer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive. Please contact the administrator."
        )

    role = officer.role.upper()
    dashboard_route = ROLE_DASHBOARD_ROUTES.get(role, "/government/licensing-dashboard")
    service_ids = ROLE_SERVICE_IDS.get(role, [])
    permissions = SUPER_ADMIN_PERMISSIONS if role == "SUPER_ADMIN" else ALL_OFFICER_PERMISSIONS

    # Token expiry
    expire_minutes = 60 * 24 * 30 if req.rememberMe else 60 * 8  # 30 days or 8 hours

    token_data = {
        "sub": officer.id,
        "email": officer.email,
        "role": role,
        "dashboard_route": dashboard_route,
        "service_ids": service_ids,
        "is_government_officer": True,
    }
    access_token = create_access_token(token_data, expires_delta=timedelta(minutes=expire_minutes))

    officer_info = GovernmentOfficerInfo(
        id=officer.id,
        fullName=officer.full_name,
        email=officer.email,
        role=role,
        roleDisplayName=ROLE_DISPLAY_NAMES.get(role, role),
        department=officer.department,
        designation=officer.designation,
        mobile=officer.mobile,
        dashboardRoute=dashboard_route,
        serviceIds=service_ids,
        permissions=permissions,
    )

    return GovernmentLoginResponse(
        success=True,
        token=access_token,
        officer=officer_info,
    )


@router.get("/me", response_model=GovernmentOfficerInfo)
def get_government_officer_profile(
    db: Session = Depends(get_db),
    credentials=Depends(HTTPBearer(auto_error=False))
):
    """Return the authenticated officer's profile."""
    from app.services.auth_service import decode_access_token

    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication token is missing.")

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("is_government_officer"):
        raise HTTPException(status_code=401, detail="Invalid or expired government officer token.")

    officer_id = payload.get("sub")
    officer = db.query(Officer).filter(Officer.id == officer_id, Officer.is_active == True).first()
    if not officer:
        raise HTTPException(status_code=401, detail="Officer account not found or inactive.")

    role = officer.role.upper()
    return GovernmentOfficerInfo(
        id=officer.id,
        fullName=officer.full_name,
        email=officer.email,
        role=role,
        roleDisplayName=ROLE_DISPLAY_NAMES.get(role, role),
        department=officer.department,
        designation=officer.designation,
        mobile=officer.mobile,
        dashboardRoute=ROLE_DASHBOARD_ROUTES.get(role, "/government/licensing-dashboard"),
        serviceIds=ROLE_SERVICE_IDS.get(role, []),
        permissions=SUPER_ADMIN_PERMISSIONS if role == "SUPER_ADMIN" else ALL_OFFICER_PERMISSIONS,
    )

