from typing import Optional
from pydantic import BaseModel

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
