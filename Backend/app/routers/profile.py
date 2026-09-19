"""
GovEaseAI Citizen Profile Router
Provides endpoints to fetch and update citizen profile information
and calculate profile completion dynamically for the authenticated citizen.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.profile import CitizenProfile
from app.routers.deps import get_current_user, require_citizen

router = APIRouter(prefix="/api/profile", tags=["Citizen Profile"])

class ProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    preferredLanguage: Optional[str] = None
    notificationPreferences: Optional[str] = None

class ProfileResponse(BaseModel):
    userId: str
    fullName: str
    email: str
    phone: Optional[str] = None
    applicantId: Optional[str] = None
    role: str
    profileCompletion: int
    dob: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    preferredLanguage: Optional[str] = "English"
    notificationPreferences: Optional[str] = "Email and SMS"

def calculate_completion_percentage(user: User, profile: Optional[CitizenProfile]) -> int:
    """Calculate profile completion percentage based on filled citizen profile fields."""
    fields = [
        bool(user.full_name),
        bool(user.email),
        bool(user.phone),
        bool(user.applicant_id),
    ]
    if profile:
        fields.extend([
            bool(profile.dob),
            bool(profile.address),
            bool(profile.city or profile.state),
            bool(profile.pincode),
            bool(profile.occupation),
            bool(profile.education),
        ])
    else:
        fields.extend([False] * 6)
    
    filled = sum(1 for f in fields if f)
    total = len(fields)
    return max(20, round((filled / total) * 100))

@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == current_user.id).first()
    completion = calculate_completion_percentage(current_user, profile)
    
    return ProfileResponse(
        userId=current_user.id,
        fullName=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        applicantId=current_user.applicant_id,
        role=current_user.role.lower(),
        profileCompletion=completion,
        dob=profile.dob if profile else None,
        address=profile.address if profile else None,
        city=profile.city if profile else None,
        district=profile.district if profile else None,
        state=profile.state if profile else None,
        pincode=profile.pincode if profile else None,
        occupation=profile.occupation if profile else None,
        education=profile.education if profile else None,
        preferredLanguage=profile.preferred_language if profile else "English",
        notificationPreferences=profile.notification_preferences if profile else "Email and SMS"
    )

@router.get("/completion")
def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == current_user.id).first()
    completion = calculate_completion_percentage(current_user, profile)
    current_user.profile_completion = str(completion)
    db.commit()
    return {
        "userId": current_user.id,
        "applicantId": current_user.applicant_id,
        "profileCompletion": completion
    }

@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    if req.fullName and req.fullName.strip():
        current_user.full_name = req.fullName.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip() if req.phone else None

    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == current_user.id).first()
    if not profile:
        profile = CitizenProfile(user_id=current_user.id)
        db.add(profile)

    if req.dob is not None: profile.dob = req.dob
    if req.address is not None: profile.address = req.address
    if req.city is not None: profile.city = req.city
    if req.district is not None: profile.district = req.district
    if req.state is not None: profile.state = req.state
    if req.pincode is not None: profile.pincode = req.pincode
    if req.occupation is not None: profile.occupation = req.occupation
    if req.education is not None: profile.education = req.education
    if req.preferredLanguage is not None: profile.preferred_language = req.preferredLanguage
    if req.notificationPreferences is not None: profile.notification_preferences = req.notificationPreferences

    completion = calculate_completion_percentage(current_user, profile)
    current_user.profile_completion = str(completion)
    db.commit()
    db.refresh(current_user)
    db.refresh(profile)

    return ProfileResponse(
        userId=current_user.id,
        fullName=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        applicantId=current_user.applicant_id,
        role=current_user.role.lower(),
        profileCompletion=completion,
        dob=profile.dob,
        address=profile.address,
        city=profile.city,
        district=profile.district,
        state=profile.state,
        pincode=profile.pincode,
        occupation=profile.occupation,
        education=profile.education,
        preferredLanguage=profile.preferred_language,
        notificationPreferences=profile.notification_preferences
    )
