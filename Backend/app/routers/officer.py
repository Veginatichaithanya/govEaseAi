import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.activity import ApplicationActivity
from app.models.department import GovernmentDepartment
from app.models.notification import Notification
from app.models.user import User
from app.schemas.application import (
    ApplicationResponse,
    OfficerActionRequest,
    OfficerDashboardStats
)
from app.schemas.activity import ActivityResponse
from app.routers.deps import require_officer, get_current_user_optional
from app.routers.applications import serialize_application

router = APIRouter(prefix="/api/officer", tags=["Government Officer Desk"])

@router.get("/applications", response_model=List[ApplicationResponse])
def get_officer_applications(
    departmentId: Optional[str] = None,
    status_filter: Optional[str] = None,
    service_id: Optional[str] = None,
    search: Optional[str] = None,
    current_officer: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """Retrieve applications strictly assigned to the authenticated officer's department."""
    if departmentId and departmentId != current_officer.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Statutory Department Restriction: Access denied to other department applications."
        )
    dept_id = current_officer.department_id

    query = db.query(Application).filter(Application.department_id == dept_id)

    if status_filter:
        s = status_filter.upper()
        if s == "PENDING":
            query = query.filter(Application.status.in_(["SUBMITTED", "AI_PROCESSING", "OFFICER_REVIEW", "RESUBMITTED"]))
        elif s in ["CORRECTION", "CORRECTION_REQUIRED", "CORRECTION_REQUESTED"]:
            query = query.filter(Application.status.in_(["CORRECTION_REQUIRED", "CORRECTION_REQUESTED"]))
        elif s == "APPROVED":
            query = query.filter(Application.status.in_(["APPROVED", "DIGITAL_APPROVAL"]))
        elif s == "REJECTED":
            query = query.filter(Application.status == "REJECTED")
        elif s != "ALL":
            query = query.filter(Application.status == s)

    if service_id:
        query = query.filter(Application.service_id == service_id)

    apps = query.order_by(Application.updated_at.desc()).all()

    if search and search.strip():
        q = search.strip().lower()
        filtered = []
        for a in apps:
            app_id = (a.id or "").lower()
            applicant_name = (a.citizen.full_name if a.citizen else "").lower()
            service_name = (a.service.name if a.service else "").lower()
            business_name = (a.form_data.get("businessName") or a.form_data.get("applicantName") or "").lower()
            if q in app_id or q in applicant_name or q in service_name or q in business_name:
                filtered.append(a)
        apps = filtered

    return [serialize_application(a) for a in apps]

@router.get("/applications/{application_id}", response_model=ApplicationResponse)
def get_officer_application_detail(
    application_id: str,
    departmentId: Optional[str] = None,
    current_officer: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """Retrieve single application strictly enforcing statutory officer department isolation."""
    dept_id = current_officer.department_id

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    if app.department_id != dept_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Statutory Department Restriction: You are not authorized to access applications outside your department."
        )

    return serialize_application(app)

@router.get("/stats", response_model=OfficerDashboardStats)
@router.get("/dashboard/stats", response_model=OfficerDashboardStats)
def get_officer_stats(
    departmentId: Optional[str] = None,
    current_officer: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """Statistics strictly scoped to officer's assigned department using PostgreSQL SQL aggregation."""
    if departmentId and departmentId != current_officer.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Statutory Department Restriction: Access denied to other department statistics."
        )
    dept_id = current_officer.department_id

    # Efficient SQL aggregation: GROUP BY status
    status_counts = dict(
        db.query(Application.status, func.count(Application.id))
        .filter(Application.department_id == dept_id)
        .group_by(Application.status)
        .all()
    )

    total = sum(status_counts.values())
    submitted = status_counts.get("SUBMITTED", 0)
    ai_processing = status_counts.get("AI_PROCESSING", 0)
    under_review = status_counts.get("OFFICER_REVIEW", 0)
    resubmitted = status_counts.get("RESUBMITTED", 0)
    pending = submitted + ai_processing + under_review + resubmitted
    correction = status_counts.get("CORRECTION_REQUIRED", 0) + status_counts.get("CORRECTION_REQUESTED", 0)
    approved = status_counts.get("APPROVED", 0) + status_counts.get("DIGITAL_APPROVAL", 0)
    rejected = status_counts.get("REJECTED", 0)

    # Department metadata
    dept = db.query(GovernmentDepartment).filter(GovernmentDepartment.id == dept_id).first()
    dept_info = {
        "id": dept.id if dept else dept_id,
        "name": dept.name if dept else dept_id,
        "code": dept.code if dept else ""
    }

    return OfficerDashboardStats(
        total=total,
        pendingReview=pending,
        correctionRequired=correction,
        approved=approved,
        rejected=rejected,
        submitted=submitted,
        underReview=under_review,
        resubmitted=resubmitted,
        aiProcessing=ai_processing,
        department=dept_info,
        total_applications=total,
        pending_review=pending,
        correction_required=correction,
        under_review=under_review
    )

@router.get("/activities", response_model=List[ActivityResponse])
def get_department_activities(
    departmentId: Optional[str] = None,
    current_officer: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    if departmentId and departmentId != current_officer.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Statutory Department Restriction: Access denied to other department activity."
        )
    dept_id = current_officer.department_id

    activities = db.query(ApplicationActivity).filter(
        ApplicationActivity.department_id == dept_id
    ).order_by(ApplicationActivity.created_at.desc()).limit(50).all()

    results = []
    for act in activities:
        results.append(ActivityResponse(
            id=act.id,
            departmentId=act.department_id,
            applicationId=act.application_id,
            applicantName=act.application.citizen.full_name if act.application and act.application.citizen else None,
            serviceName=act.application.service.name if act.application and act.application.service else None,
            actionType=act.action_type,
            description=act.description,
            timestamp=act.created_at.isoformat() if act.created_at else "",
            officerName=act.actor_name
        ))
    return results

@router.post("/applications/{application_id}/approve", response_model=ApplicationResponse)
def approve_application(
    application_id: str,
    req: OfficerActionRequest,
    current_officer: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    # Statutory Department Authorization Check
    if app.department_id != current_officer.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to approve this application: Statutory Department Restriction."
        )

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    dept_code = app.department.code if app.department else "GOV"
    random_suffix = random.randint(10000, 99999)
    approval_ref = f"GEAI/{dept_code}/{now.year}/{random_suffix}"

    officer_name = req.officerName or current_officer.full_name
    remarks = req.remarks or "Statutory criteria fulfilled. Digital license sanctioned."

    app.status = "APPROVED"
    app.current_step = 9
    app.approval_reference = approval_ref
    app.approval_date = today_str
    app.officer_remarks = remarks
    app.officer_decided_by = officer_name
    app.officer_decided_at = now
    app.updated_at = now

    # Record Activity
    activity = ApplicationActivity(
        id=f"act-{app.id}-appr-{int(now.timestamp())}",
        application_id=app.id,
        department_id=app.department_id,
        actor_user_id=current_officer.id,
        actor_name=officer_name,
        action_type="APPLICATION_APPROVED",
        description=f"Application {app.id} approved. Digital license {approval_ref} sanctioned."
    )
    db.add(activity)

    # Notification for citizen
    notif = Notification(
        id=f"notif-{app.id}-appr-{int(now.timestamp())}",
        user_id=app.citizen_id,
        title=f"Application Approved: {app.service.name}",
        description=f"Congratulations! Your application {app.id} has been approved by {app.department.name}. Reference: {approval_ref}.",
        type="success",
        read=False,
        related_application_id=app.id,
        action_url=f"/applications/{app.id}/approval"
    )
    db.add(notif)

    db.commit()
    db.refresh(app)
    return serialize_application(app)

@router.post("/applications/{application_id}/correction", response_model=ApplicationResponse)
def request_correction(
    application_id: str,
    req: OfficerActionRequest,
    current_officer: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    if app.department_id != current_officer.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to request corrections on this application: Statutory Department Restriction."
        )

    if not req.remarks or not req.remarks.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specific correction remarks are required."
        )

    now = datetime.now(timezone.utc)
    officer_name = req.officerName or current_officer.full_name
    remarks = req.remarks.strip()

    app.status = "CORRECTION_REQUIRED"
    app.remarks = remarks
    app.officer_remarks = remarks
    app.officer_decided_by = officer_name
    app.officer_decided_at = now
    app.updated_at = now

    # Record Activity
    activity = ApplicationActivity(
        id=f"act-{app.id}-corr-{int(now.timestamp())}",
        application_id=app.id,
        department_id=app.department_id,
        actor_user_id=current_officer.id,
        actor_name=officer_name,
        action_type="CORRECTION_REQUESTED",
        description=f"Correction requested for {app.id}: {remarks[:100]}"
    )
    db.add(activity)

    # Notification for citizen
    notif = Notification(
        id=f"notif-{app.id}-corr-{int(now.timestamp())}",
        user_id=app.citizen_id,
        title=f"Correction Required: {app.service.name}",
        description=f"Officer requested clarification on {app.id}. Remarks: {remarks}",
        type="warning",
        read=False,
        related_application_id=app.id,
        action_url=f"/applications/{app.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(app)
    return serialize_application(app)

@router.post("/applications/{application_id}/reject", response_model=ApplicationResponse)
def reject_application(
    application_id: str,
    req: OfficerActionRequest,
    current_officer: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    if app.department_id != current_officer.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to reject this application: Statutory Department Restriction."
        )

    if not req.remarks or not req.remarks.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A statutory reason for rejection is required."
        )

    now = datetime.now(timezone.utc)
    officer_name = req.officerName or current_officer.full_name
    reason = req.remarks.strip()

    app.status = "REJECTED"
    app.remarks = reason
    app.officer_remarks = reason
    app.officer_decided_by = officer_name
    app.officer_decided_at = now
    app.updated_at = now

    # Record Activity
    activity = ApplicationActivity(
        id=f"act-{app.id}-rej-{int(now.timestamp())}",
        application_id=app.id,
        department_id=app.department_id,
        actor_user_id=current_officer.id,
        actor_name=officer_name,
        action_type="APPLICATION_REJECTED",
        description=f"Application {app.id} rejected. Reason: {reason[:100]}"
    )
    db.add(activity)

    # Notification for citizen
    notif = Notification(
        id=f"notif-{app.id}-rej-{int(now.timestamp())}",
        user_id=app.citizen_id,
        title=f"Application Rejected: {app.service.name}",
        description=f"Your application {app.id} was rejected by {app.department.name}. Reason: {reason}",
        type="alert",
        read=False,
        related_application_id=app.id,
        action_url=f"/applications/{app.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(app)
    return serialize_application(app)

@router.get("/applications/{application_id}/timeline")
def get_officer_application_timeline(
    application_id: str,
    current_officer: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Return the full activity timeline for an application — scoped to officer's department."""
    from app.models.activity import ApplicationActivity as Act

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    # Department authorization
    if current_officer and current_officer.role.upper() == "OFFICER":
        if app.department_id != current_officer.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Statutory Department Restriction: Access denied."
            )

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
