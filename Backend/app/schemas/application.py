from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class DocumentItemSchema(BaseModel):
    documentId: str
    documentName: str
    fileName: str
    fileSize: int
    fileType: str
    status: str
    uploadedAt: str
    verificationResult: Optional[Dict[str, Any]] = None

class ApplicationCreateRequest(BaseModel):
    serviceId: str
    initialFormData: Optional[Dict[str, Any]] = None

class ApplicationUpdateRequest(BaseModel):
    formData: Optional[Dict[str, Any]] = None
    fieldMetadata: Optional[Dict[str, Any]] = None
    currentStep: Optional[int] = None
    uploadedDocuments: Optional[List[DocumentItemSchema]] = None

class OfficerActionRequest(BaseModel):
    remarks: Optional[str] = None
    officerName: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    userId: str
    serviceId: str
    serviceName: str
    status: str
    currentStep: int
    formData: Dict[str, Any] = {}
    fieldMetadata: Dict[str, Any] = {}
    uploadedDocuments: List[DocumentItemSchema] = []
    createdAt: str
    updatedAt: str
    departmentId: Optional[str] = None
    department: Optional[str] = None
    remarks: Optional[str] = None
    officerRemarks: Optional[str] = None
    officerDecidedBy: Optional[str] = None
    officerDecidedAt: Optional[str] = None
    approvalReference: Optional[str] = None
    approvalDate: Optional[str] = None
    submittedAt: Optional[str] = None
    riskLevel: Optional[str] = None
    priority: Optional[str] = None
    aiVerificationSummary: Optional[str] = None

class OfficerDashboardStats(BaseModel):
    total: int
    pendingReview: int
    correctionRequired: int
    approved: int
    rejected: int
    submitted: int = 0
    underReview: int = 0
    resubmitted: int = 0
    aiProcessing: int = 0
    department: Optional[Dict[str, Any]] = None
    # Snake_case aliases for API flexibility
    total_applications: Optional[int] = None
    pending_review: Optional[int] = None
    correction_required: Optional[int] = None
    under_review: Optional[int] = None

class CitizenStats(BaseModel):
    total: int
    pendingReview: int
    correctionRequired: int
    approved: int
    rejected: int
