from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str
    role: Optional[str] = None
    departmentId: Optional[str] = None

class SignupRequest(BaseModel):
    fullName: str
    email: str
    mobile: str
    password: str
    confirmPassword: str

class SignupResponse(BaseModel):
    success: bool
    message: str
    userId: Optional[str] = None

class UserInfo(BaseModel):
    id: str
    email: str
    name: str
    fullName: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    phone: Optional[str] = None
    applicantId: Optional[str] = None
    applicant_id: Optional[str] = None
    profileCompletion: Optional[int] = 45
    departmentId: Optional[str] = None
    departmentName: Optional[str] = None
    departmentCode: Optional[str] = None
    officerTitle: Optional[str] = None
    permissions: List[str] = []
    serviceIds: List[str] = []

class LoginResponse(BaseModel):
    success: bool = True
    token: str
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserInfo


class OfficerLoginRequest(BaseModel):
    department: str
    email: str
    password: str


class OfficerUserInfo(BaseModel):
    id: str
    fullName: str
    email: str
    role: str = "OFFICER"
    department: str
    departmentId: str
    departmentCode: Optional[str] = None
    designation: Optional[str] = None
    serviceIds: List[str] = []
    permissions: List[str] = []


class OfficerLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    token: str
    user: OfficerUserInfo

