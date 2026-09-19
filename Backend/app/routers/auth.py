from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.profile import CitizenProfile
from app.models.department import GovernmentDepartment
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserInfo,
    SignupRequest,
    OfficerLoginRequest,
    OfficerLoginResponse,
    OfficerUserInfo,
)
from app.services.auth_service import verify_password, create_access_token
from app.routers.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ALL_OFFICER_PERMISSIONS = [
    "VIEW_APPLICATIONS",
    "VIEW_DOCUMENTS",
    "REVIEW_APPLICATION",
    "REQUEST_CORRECTION",
    "REJECT_APPLICATION",
    "APPROVE_APPLICATION",
    "ISSUE_DIGITAL_LICENSE"
]

import re
from typing import Optional

def normalize_indian_phone(phone_str: Optional[str]) -> Optional[str]:
    """
    Normalizes Indian phone numbers to standard 10-digit format.
    Handles:
      +91XXXXXXXXXX
      91XXXXXXXXXX
      +91 XXXXX XXXXX
      +91-XXXXX-XXXXX
      0XXXXXXXXXX
      XXXXXXXXXX
    Returns 10-digit string or None if not a valid number.
    """
    if not phone_str:
        return None
    # Strip all non-digit characters
    digits = re.sub(r"\D", "", phone_str.strip())
    if digits.startswith("91") and len(digits) == 12:
        return digits[2:]
    if digits.startswith("0") and len(digits) == 11:
        return digits[1:]
    if len(digits) == 10:
        return digits
    return digits if digits else None

@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Register a new citizen account in PostgreSQL."""
    import uuid
    from app.services.auth_service import hash_password

    if req.password != req.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Passwords do not match."
        )

    if len(req.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters long."
        )

    email = req.email.strip().lower()
    raw_mobile = req.mobile.strip() if req.mobile else None
    norm_mobile = normalize_indian_phone(raw_mobile) if raw_mobile else None
    mobile_to_store = norm_mobile or raw_mobile
    full_name = req.fullName.strip()

    # Check email uniqueness
    existing_email = db.query(User).filter(User.email.ilike(email)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # Check mobile uniqueness
    if mobile_to_store:
        phone_candidates = {mobile_to_store}
        if norm_mobile:
            phone_candidates.add(norm_mobile)
            phone_candidates.add(f"+91{norm_mobile}")
            phone_candidates.add(f"+91 {norm_mobile}")
            phone_candidates.add(f"91{norm_mobile}")
            if len(norm_mobile) == 10:
                phone_candidates.add(f"+91 {norm_mobile[:5]} {norm_mobile[5:]}")
        existing_mobile = db.query(User).filter(User.phone.in_(list(phone_candidates))).first()
        if existing_mobile:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this mobile number already exists."
            )

    new_user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=hash_password(req.password),
        full_name=full_name,
        phone=mobile_to_store,
        applicant_id=f"CIT-{uuid.uuid4().hex[:8].upper()}",
        role="CITIZEN",
        is_active=True,
        profile_completion="20"
    )

    new_profile = CitizenProfile(
        id=str(uuid.uuid4()),
        user_id=new_user.id,
        preferred_language="English",
        notification_preferences="Email and SMS"
    )

    try:
        db.add(new_user)
        db.add(new_profile)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account. Please try again."
        )

    return {
        "success": True,
        "message": "Citizen account created successfully.",
        "userId": new_user.id
    }

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    raw_identifier = (req.identifier or req.email or "").strip()
    if not raw_identifier:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number/email or password."
        )

    # 1. Look up user by email or normalized phone
    if "@" in raw_identifier:
        user = db.query(User).filter(User.email.ilike(raw_identifier.lower())).first()
    else:
        norm = normalize_indian_phone(raw_identifier)
        phone_candidates = {raw_identifier}
        if norm:
            phone_candidates.add(norm)
            phone_candidates.add(f"+91{norm}")
            phone_candidates.add(f"+91 {norm}")
            phone_candidates.add(f"91{norm}")
            if len(norm) == 10:
                phone_candidates.add(f"+91 {norm[:5]} {norm[5:]}")
        user = db.query(User).filter(User.phone.in_(list(phone_candidates))).first()
        if not user:
            # Fallback to check email in case identifier didn't contain @
            user = db.query(User).filter(User.email.ilike(raw_identifier.lower())).first()

    # 2. Strict password verification
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number/email or password."
        )

    # 3. Active account check
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact administration."
        )

    # 4. If departmentId is provided (officer login), verify assigned department
    if req.departmentId:
        if user.role.upper() != "OFFICER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account does not possess authorized officer credentials."
            )
        if user.department_id != req.departmentId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="These credentials are not assigned to the selected department."
            )

    dept = None
    service_ids = []
    if user.department_id:
        dept = db.query(GovernmentDepartment).filter(GovernmentDepartment.id == user.department_id).first()
        if dept:
            service_ids = [s.id for s in dept.services]

    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.lower(),
        "dept": user.department_id
    }
    access_token = create_access_token(token_data)

    user_info = UserInfo(
        id=user.id,
        email=user.email,
        name=user.full_name,
        fullName=user.full_name,
        full_name=user.full_name,
        role=user.role.lower(),
        phone=user.phone,
        applicantId=user.applicant_id,
        applicant_id=user.applicant_id,
        profileCompletion=int(user.profile_completion or 45),
        departmentId=user.department_id,
        departmentName=dept.name if dept else None,
        departmentCode=dept.code if dept else None,
        officerTitle=user.officer_title,
        permissions=ALL_OFFICER_PERMISSIONS if user.role.upper() == "OFFICER" else [],
        serviceIds=service_ids
    )

    return LoginResponse(
        success=True,
        token=access_token,
        access_token=access_token,
        token_type="bearer",
        user=user_info
    )

@router.get("/me", response_model=UserInfo)
def get_current_user_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dept = None
    service_ids = []
    if user.department_id:
        dept = db.query(GovernmentDepartment).filter(GovernmentDepartment.id == user.department_id).first()
        if dept:
            service_ids = [s.id for s in dept.services]

    return UserInfo(
        id=user.id,
        email=user.email,
        name=user.full_name,
        fullName=user.full_name,
        full_name=user.full_name,
        role=user.role.lower(),
        phone=user.phone,
        applicantId=user.applicant_id,
        applicant_id=user.applicant_id,
        profileCompletion=int(user.profile_completion or 45),
        departmentId=user.department_id,
        departmentName=dept.name if dept else None,
        departmentCode=dept.code if dept else None,
        officerTitle=user.officer_title,
        permissions=ALL_OFFICER_PERMISSIONS if user.role.upper() == "OFFICER" else [],
        serviceIds=service_ids
    )


# ── Office / Department Normalization Maps ───────────────────────────────────

OFFICE_DEPARTMENT_MAP = {
    # 1. Municipal Licensing Division
    "municipal-licensing": "municipal-licensing",
    "municipal_licensing": "municipal-licensing",
    "municipal licensing division": "municipal-licensing",
    "mld": "municipal-licensing",
    # 2. Department of Labour
    "department-labour": "department-labour",
    "department_labour": "department-labour",
    "department of labour": "department-labour",
    "dol": "department-labour",
    # 3. Directorate of Industries
    "directorate-industries": "directorate-industries",
    "directorate_industries": "directorate-industries",
    "directorate of industries": "directorate-industries",
    "doi": "directorate-industries",
    # 4. Urban Development & Town Planning
    "urban-development": "urban-development",
    "urban_development": "urban-development",
    "urban development & town planning": "urban-development",
    "urban development and town planning": "urban-development",
    "udtp": "urban-development",
    # 5. Inspectorate of Factories
    "inspectorate-factories": "inspectorate-factories",
    "inspectorate_factories": "inspectorate-factories",
    "inspectorate of factories": "inspectorate-factories",
    "iof": "inspectorate-factories",
    # 6. Pollution Control Board
    "pollution-control": "pollution-control",
    "pollution_control": "pollution-control",
    "pollution control board": "pollution-control",
    "pcb": "pollution-control",
}

DEPARTMENT_SERVICES_MAP = {
    "municipal-licensing": ["trade-license", "shop-registration"],
    "department-labour": ["shop-registration"],
    "directorate-industries": ["business-license"],
    "urban-development": ["building-permission"],
    "inspectorate-factories": ["factory-registration"],
    "pollution-control": ["pollution-certificate"],
}


@router.post("/officer/login", response_model=OfficerLoginResponse)
def officer_login(req: OfficerLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a statutory government officer.
    Verifies credentials and strictly enforces assigned department.
    """
    email = req.email.strip().lower()
    dept_raw = req.department.strip().lower()

    # 1. Find officer by email
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # 2. Verify password hash
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # 3. Verify officer is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your officer account is inactive."
        )

    if user.role.upper() != "OFFICER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account does not possess authorized officer credentials."
        )

    # 4. Verify selected department matches officer.department
    normalized_selected_dept = OFFICE_DEPARTMENT_MAP.get(dept_raw, dept_raw)
    normalized_user_dept = OFFICE_DEPARTMENT_MAP.get(
        (user.department_id or "").strip().lower(), (user.department_id or "").strip().lower()
    )

    if normalized_selected_dept != normalized_user_dept:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Selected office does not match this officer account."
        )

    # 5. Generate JWT
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": "officer",
        "dept": user.department_id,
        "is_government_officer": True,
    }
    access_token = create_access_token(token_data)

    # 6. Resolve department metadata & service list
    dept = db.query(GovernmentDepartment).filter(GovernmentDepartment.id == user.department_id).first()
    service_ids = DEPARTMENT_SERVICES_MAP.get(user.department_id, [])

    return OfficerLoginResponse(
        access_token=access_token,
        token_type="bearer",
        token=access_token,
        user=OfficerUserInfo(
            id=user.id,
            fullName=user.full_name,
            email=user.email,
            role="OFFICER",
            department=dept.name if dept else user.department_id,
            departmentId=user.department_id,
            departmentCode=dept.code if dept else None,
            designation=user.officer_title,
            serviceIds=service_ids,
            permissions=ALL_OFFICER_PERMISSIONS,
        )
    )

