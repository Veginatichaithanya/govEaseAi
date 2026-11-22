from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.service import GovernmentService
from app.models.activity import ApplicationActivity
from app.models.notification import Notification
from app.models.user import User
from app.schemas.application import (
    ApplicationCreateRequest,
    ApplicationUpdateRequest,
    ApplicationResponse,
    CitizenStats,
    DocumentItemSchema
)
from app.routers.deps import get_current_user, require_citizen, get_current_user_optional
from app.services.application_number import generate_next_application_number

router = APIRouter(prefix="/api/applications", tags=["Citizen Applications"])

def serialize_application(app: Application) -> ApplicationResponse:
    docs = []
    for d in app.documents:
        docs.append(DocumentItemSchema(
            documentId=d.id,
            documentName=d.document_type,
            fileName=d.file_name,
            fileSize=d.file_size or 0,
            fileType=d.mime_type or "application/octet-stream",
            status=d.status,
            uploadedAt=d.uploaded_at.isoformat() if d.uploaded_at else "",
            verificationResult=d.verification_result
        ))

    return ApplicationResponse(
        id=app.id,
        userId=app.citizen_id,
        serviceId=app.service_id,
        serviceName=app.service.name if app.service else "",
        status=app.status,
        currentStep=app.current_step,
        formData=app.form_data or {},
        fieldMetadata=app.field_metadata or {},
        uploadedDocuments=docs,
        createdAt=app.created_at.isoformat() if app.created_at else "",
        updatedAt=app.updated_at.isoformat() if app.updated_at else "",
        departmentId=app.department_id,
        department=app.department.name if app.department else "",
        remarks=app.remarks,
        officerRemarks=app.officer_remarks,
        officerDecidedBy=app.officer_decided_by,
        officerDecidedAt=app.officer_decided_at.isoformat() if app.officer_decided_at else None,
        approvalReference=app.approval_reference,
        approvalDate=app.approval_date,
        submittedAt=app.submitted_at.isoformat() if app.submitted_at else None,
        riskLevel=app.risk_level or "LOW",
        priority=app.priority or "Normal",
        aiVerificationSummary=app.ai_verification_summary
    )

@router.get("", response_model=List[ApplicationResponse])
def get_citizen_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve applications owned strictly by the authenticated citizen."""
    apps = db.query(Application).filter(Application.citizen_id == current_user.id).order_by(Application.updated_at.desc()).all()
    return [serialize_application(a) for a in apps]

@router.get("/stats/summary", response_model=CitizenStats)
def get_citizen_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(Application.citizen_id == current_user.id).all()
    total = len(apps)
    pending = len([a for a in apps if a.status in ["SUBMITTED", "AI_PROCESSING", "OFFICER_REVIEW", "RESUBMITTED"]])
    correction = len([a for a in apps if a.status == "CORRECTION_REQUIRED"])
    approved = len([a for a in apps if a.status in ["APPROVED", "DIGITAL_APPROVAL"]])
    rejected = len([a for a in apps if a.status == "REJECTED"])

    return CitizenStats(
        total=total,
        pendingReview=pending,
        correctionRequired=correction,
        approved=approved,
        rejected=rejected
    )

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application_by_id(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    # Ownership / Department Authorization Check
    if current_user.role.upper() == "CITIZEN":
        if app.citizen_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this application."
            )
    elif current_user.role.upper() == "OFFICER":
        if app.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this application: Statutory Department Restriction."
            )

    return serialize_application(app)

@router.post("", response_model=ApplicationResponse)
def create_application(
    req: ApplicationCreateRequest,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    # Check if existing draft exists for citizen + service
    existing_draft = db.query(Application).filter(
        Application.citizen_id == current_user.id,
        Application.service_id == req.serviceId,
        Application.status == "DRAFT"
    ).first()

    if existing_draft:
        return serialize_application(existing_draft)

    service = db.query(GovernmentService).filter(GovernmentService.id == req.serviceId).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{req.serviceId}' not found."
        )

    new_app_number = generate_next_application_number(db)
    form_data = req.initialFormData or {}
    field_metadata = {k: {"source": "MANUAL"} for k in form_data.keys()}

    new_app = Application(
        id=new_app_number,
        application_number=new_app_number,
        service_id=service.id,
        department_id=service.department_id,
        citizen_id=current_user.id,
        status="DRAFT",
        current_step=1,
        form_data=form_data,
        field_metadata=field_metadata,
        risk_level="LOW",
        priority="Normal"
    )

    db.add(new_app)

    # Activity record
    activity = ApplicationActivity(
        id=f"act-{new_app.id}-created",
        application_id=new_app.id,
        department_id=service.department_id,
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        action_type="APPLICATION_CREATED",
        description=f"Draft application created for {service.name}."
    )
    db.add(activity)

    db.commit()
    db.refresh(new_app)
    return serialize_application(new_app)

@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: str,
    req: ApplicationUpdateRequest,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    if app.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this application."
        )

    if req.formData is not None:
        merged_form = dict(app.form_data or {})
        merged_form.update(req.formData)
        app.form_data = merged_form

        # Update field metadata
        current_meta = dict(app.field_metadata or {})
        for k in req.formData.keys():
            if k not in current_meta:
                current_meta[k] = {"source": "MANUAL"}
        app.field_metadata = current_meta

    if req.currentStep is not None:
        app.current_step = req.currentStep

    app.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app)
    return serialize_application(app)

@router.post("/{application_id}/submit", response_model=ApplicationResponse)
def submit_application(
    application_id: str,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    if app.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to submit this application."
        )

    now = datetime.now(timezone.utc)
    app.status = "SUBMITTED"
    app.current_step = 8
    app.submitted_at = now
    app.updated_at = now
    app.ai_verification_summary = "Application verified and forwarded to authorized officer appraisal desk."

    # Record activity
    activity = ApplicationActivity(
        id=f"act-{app.id}-sub-{int(now.timestamp())}",
        application_id=app.id,
        department_id=app.department_id,
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        action_type="APPLICATION_SUBMITTED",
        description=f"Application {app.id} submitted for desk scrutiny."
    )
    db.add(activity)

    # Notification for citizen
    notif = Notification(
        id=f"notif-{app.id}-sub-{int(now.timestamp())}",
        user_id=current_user.id,
        title=f"{app.service.name} Submitted Successfully",
        description=f"Your application {app.id} has been submitted and routed to the {app.department.name} queue.",
        type="info",
        read=False,
        related_application_id=app.id,
        action_url=f"/applications/{app.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(app)
    return serialize_application(app)

@router.post("/{application_id}/resubmit", response_model=ApplicationResponse)
def resubmit_application(
    application_id: str,
    req: ApplicationUpdateRequest,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    """
    Citizen resubmits an application that was in CORRECTION_REQUIRED state.
    Merges any updated form data and transitions status to RESUBMITTED → OFFICER_REVIEW.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    if app.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to resubmit this application."
        )

    if app.status != "CORRECTION_REQUIRED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only applications in CORRECTION_REQUIRED state can be resubmitted. Current status: {app.status}"
        )

    now = datetime.now(timezone.utc)

    # Merge updated form data if provided
    if req.formData:
        merged_form = dict(app.form_data or {})
        merged_form.update(req.formData)
        app.form_data = merged_form

        # Update field metadata
        current_meta = dict(app.field_metadata or {})
        for k in req.formData.keys():
            if k not in current_meta:
                current_meta[k] = {"source": "MANUAL"}
        app.field_metadata = current_meta

    app.status = "RESUBMITTED"
    app.current_step = 8
    app.updated_at = now
    # Clear previous officer remarks on resubmission so officer sees fresh state
    app.remarks = None

    # Record activity
    activity = ApplicationActivity(
        id=f"act-{app.id}-resub-{int(now.timestamp())}",
        application_id=app.id,
        department_id=app.department_id,
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        action_type="APPLICATION_RESUBMITTED",
        description=f"Citizen resubmitted application {app.id} after correction. Routed back to officer queue."
    )
    db.add(activity)

    # Notify the citizen of successful resubmission
    notif = Notification(
        id=f"notif-{app.id}-resub-{int(now.timestamp())}",
        user_id=current_user.id,
        title=f"Application Resubmitted: {app.service.name}",
        description=f"Your corrected application {app.id} has been resubmitted and routed back to the {app.department.name} officer queue.",
        type="info",
        read=False,
        related_application_id=app.id,
        action_url=f"/applications/{app.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(app)
    return serialize_application(app)

@router.get("/{application_id}/timeline")
def get_application_timeline(
    application_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Return the ordered activity timeline for an application."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    # Authorization check
    if current_user:
        if current_user.role.upper() == "CITIZEN" and app.citizen_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if current_user.role.upper() == "OFFICER" and app.department_id != current_user.department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    events = sorted(app.activities, key=lambda a: a.created_at or datetime.min.replace(tzinfo=timezone.utc))

    return [
        {
            "id": act.id,
            "actionType": act.action_type,
            "description": act.description,
            "actorName": act.actor_name,
            "timestamp": act.created_at.isoformat() if act.created_at else "",
        }
        for act in events
    ]
