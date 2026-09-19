from typing import Optional
from pydantic import BaseModel

class ActivityResponse(BaseModel):
    id: str
    departmentId: Optional[str] = None
    applicationId: str
    applicantName: Optional[str] = None
    serviceName: Optional[str] = None
    actionType: str
    description: str
    timestamp: str
    officerName: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    userId: str
    title: str
    description: str
    createdAt: str
    read: bool
    type: str
    relatedApplicationId: Optional[str] = None
    actionUrl: Optional[str] = None
