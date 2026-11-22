"""
GovEaseAI Admin & Live Centralized Statistics Router
Directly queries PostgreSQL for all counts across citizens, officers, departments,
services, applications, documents, AI analyses, conversations, and notifications.
No mock counters, no fake stats.
"""
from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.department import GovernmentDepartment
from app.models.service import GovernmentService
from app.models.application import Application
from app.models.document import ApplicationDocument
from app.models.ai_analysis import AIAnalysis
from app.models.ai_chat import AIConversation, AIMessage
from app.models.notification import Notification

router = APIRouter(prefix="/api/admin", tags=["Administration & Global Statistics"])

@router.get("/dashboard/stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Live aggregated statistics calculated strictly from PostgreSQL.
    """
    # 1. Citizens & Officers count
    total_citizens = db.query(func.count(User.id)).filter(User.role == "CITIZEN").scalar() or 0
    total_officers = db.query(func.count(User.id)).filter(User.role == "OFFICER").scalar() or 0
    active_officers = db.query(func.count(User.id)).filter(User.role == "OFFICER", User.is_active == True).scalar() or 0
    inactive_officers = total_officers - active_officers

    # 2. Departments & Services
    total_departments = db.query(func.count(GovernmentDepartment.id)).scalar() or 0
    active_departments = total_departments

    total_services = db.query(func.count(GovernmentService.id)).scalar() or 0
    active_services = db.query(func.count(GovernmentService.id)).filter(GovernmentService.is_active == True).scalar() or 0

    # 3. Applications Breakdown by Status
    total_applications = db.query(func.count(Application.id)).scalar() or 0
    draft_apps = db.query(func.count(Application.id)).filter(Application.status == "DRAFT").scalar() or 0
    submitted_apps = db.query(func.count(Application.id)).filter(Application.status == "SUBMITTED").scalar() or 0
    under_review_apps = db.query(func.count(Application.id)).filter(
        Application.status.in_(["OFFICER_REVIEW", "AI_PROCESSING", "UNDER_REVIEW"])
    ).scalar() or 0
    correction_apps = db.query(func.count(Application.id)).filter(
        Application.status.in_(["CORRECTION_REQUIRED", "CORRECTION_REQUESTED"])
    ).scalar() or 0
    resubmitted_apps = db.query(func.count(Application.id)).filter(Application.status == "RESUBMITTED").scalar() or 0
    approved_apps = db.query(func.count(Application.id)).filter(
        Application.status.in_(["APPROVED", "DIGITAL_APPROVAL"])
    ).scalar() or 0
    rejected_apps = db.query(func.count(Application.id)).filter(Application.status == "REJECTED").scalar() or 0

    # 4. Documents Breakdown
    total_docs = db.query(func.count(ApplicationDocument.id)).scalar() or 0
    verified_docs = db.query(func.count(ApplicationDocument.id)).filter(
        ApplicationDocument.status.in_(["VERIFIED", "MATCH"])
    ).scalar() or 0
    pending_docs = db.query(func.count(ApplicationDocument.id)).filter(
        ApplicationDocument.status.in_(["PENDING", "UPLOADED", "PROCESSING"])
    ).scalar() or 0
    needs_correction_docs = db.query(func.count(ApplicationDocument.id)).filter(
        ApplicationDocument.status.in_(["REJECTED", "MISMATCH", "CORRECTION_REQUIRED", "REVIEW_REQUIRED"])
    ).scalar() or 0

    # 5. AI Analyses
    total_ai_analyses = db.query(func.count(AIAnalysis.id)).scalar() or 0
    successful_ai_analyses = db.query(func.count(AIAnalysis.id)).filter(AIAnalysis.status == "COMPLETED").scalar() or 0
    failed_ai_analyses = db.query(func.count(AIAnalysis.id)).filter(AIAnalysis.status == "FAILED").scalar() or 0

    # 6. Conversations & Messages
    total_conversations = db.query(func.count(AIConversation.id)).scalar() or 0
    total_messages = db.query(func.count(AIMessage.id)).scalar() or 0

    # 7. Notifications Breakdown
    total_notifications = db.query(func.count(Notification.id)).scalar() or 0
    unread_notifications = db.query(func.count(Notification.id)).filter(Notification.read == False).scalar() or 0

    # 8. Department-wise Application Aggregation
    dept_rows = db.query(
        GovernmentDepartment.id,
        GovernmentDepartment.name,
        GovernmentDepartment.code
    ).all()

    by_department: List[Dict[str, Any]] = []
    for d_id, d_name, d_code in dept_rows:
        dept_total = db.query(func.count(Application.id)).filter(Application.department_id == d_id).scalar() or 0
        dept_pending = db.query(func.count(Application.id)).filter(
            Application.department_id == d_id,
            Application.status.in_(["SUBMITTED", "AI_PROCESSING", "OFFICER_REVIEW", "RESUBMITTED", "CORRECTION_REQUIRED"])
        ).scalar() or 0
        dept_approved = db.query(func.count(Application.id)).filter(
            Application.department_id == d_id,
            Application.status.in_(["APPROVED", "DIGITAL_APPROVAL"])
        ).scalar() or 0
        dept_rejected = db.query(func.count(Application.id)).filter(
            Application.department_id == d_id,
            Application.status == "REJECTED"
        ).scalar() or 0

        by_department.append({
            "departmentId": d_id,
            "departmentName": d_name,
            "departmentCode": d_code,
            "total": dept_total,
            "pending": dept_pending,
            "approved": dept_approved,
            "rejected": dept_rejected
        })

    # 9. Service-wise Application Aggregation
    svc_rows = db.query(
        GovernmentService.id,
        GovernmentService.name,
        GovernmentService.department_id
    ).all()

    by_service: List[Dict[str, Any]] = []
    for s_id, s_name, s_dept_id in svc_rows:
        svc_total = db.query(func.count(Application.id)).filter(Application.service_id == s_id).scalar() or 0
        by_service.append({
            "serviceId": s_id,
            "serviceName": s_name,
            "departmentId": s_dept_id,
            "total": svc_total
        })

    return {
        "citizens": total_citizens,
        "officers": total_officers,
        "active_officers": active_officers,
        "inactive_officers": inactive_officers,
        "departments": total_departments,
        "active_departments": active_departments,
        "services": total_services,
        "active_services": active_services,
        "applications": {
            "total": total_applications,
            "draft": draft_apps,
            "submitted": submitted_apps,
            "under_review": under_review_apps,
            "correction_requested": correction_apps,
            "resubmitted": resubmitted_apps,
            "approved": approved_apps,
            "rejected": rejected_apps
        },
        "documents": {
            "total": total_docs,
            "verified": verified_docs,
            "pending": pending_docs,
            "needs_correction": needs_correction_docs
        },
        "ai": {
            "analyses": total_ai_analyses,
            "successful": successful_ai_analyses,
            "failed": failed_ai_analyses
        },
        "conversations": total_conversations,
        "messages": total_messages,
        "notifications": total_notifications,
        "unread_notifications": unread_notifications,
        "by_department": by_department,
        "by_service": by_service
    }
