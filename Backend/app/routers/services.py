from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.service import GovernmentService
from app.models.department import GovernmentDepartment
from app.schemas.service import ServiceResponse, DepartmentResponse

router = APIRouter(prefix="/api", tags=["Government Services & Departments"])

@router.get("/services", response_model=List[ServiceResponse])
def get_services(db: Session = Depends(get_db)):
    services = db.query(GovernmentService).filter(GovernmentService.is_active == True).all()
    results = []
    for s in services:
        dept_name = s.department.name if s.department else ""
        results.append(ServiceResponse(
            id=s.id,
            departmentId=s.department_id,
            department=dept_name,
            name=s.name,
            category=s.category,
            description=s.description,
            shortDescription=s.short_description,
            fee=s.fee,
            processingTime=s.processing_time,
            eligibility=s.eligibility or [],
            requiredDocuments=s.required_documents or [],
            applicationSteps=s.application_steps or [],
            iconName=s.icon_name,
            active=s.is_active
        ))
    return results

@router.get("/services/{service_id}", response_model=ServiceResponse)
def get_service(service_id: str, db: Session = Depends(get_db)):
    s = db.query(GovernmentService).filter(GovernmentService.id == service_id).first()
    if not s:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Government service '{service_id}' not found."
        )
    return ServiceResponse(
        id=s.id,
        departmentId=s.department_id,
        department=s.department.name if s.department else "",
        name=s.name,
        category=s.category,
        description=s.description,
        shortDescription=s.short_description,
        fee=s.fee,
        processingTime=s.processing_time,
        eligibility=s.eligibility or [],
        requiredDocuments=s.required_documents or [],
        applicationSteps=s.application_steps or [],
        iconName=s.icon_name,
        active=s.is_active
    )

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(GovernmentDepartment).all()
    results = []
    for d in departments:
        service_ids = [s.id for s in d.services]
        results.append(DepartmentResponse(
            departmentId=d.id,
            departmentName=d.name,
            departmentCode=d.code,
            category=d.category,
            description=d.description,
            statutoryAct=d.statutory_act,
            serviceIds=service_ids
        ))
    return results
