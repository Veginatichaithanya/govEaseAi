from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DepartmentResponse(BaseModel):
    departmentId: str
    departmentName: str
    departmentCode: str
    category: str
    description: Optional[str] = None
    statutoryAct: Optional[str] = None
    serviceIds: List[str] = []

class RequiredDocumentSchema(BaseModel):
    id: str
    name: str
    required: bool
    description: str
    type: Optional[str] = None

class ServiceResponse(BaseModel):
    id: str
    departmentId: str
    department: str
    name: str
    category: str
    description: Optional[str] = None
    shortDescription: Optional[str] = None
    fee: Optional[str] = None
    processingTime: Optional[str] = None
    eligibility: List[str] = []
    requiredDocuments: List[Dict[str, Any]] = []
    applicationSteps: List[str] = []
    iconName: Optional[str] = None
    active: bool = True
