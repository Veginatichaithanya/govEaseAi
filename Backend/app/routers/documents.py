import os
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.document import ApplicationDocument
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.application import DocumentItemSchema

router = APIRouter(prefix="/api/applications/{application_id}/documents", tags=["Application Documents"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

@router.post("", response_model=DocumentItemSchema)
async def upload_document(
    application_id: str,
    documentId: str = Form(...),
    documentName: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    # Validate application ownership (citizen)
    if current_user.role.upper() == "CITIZEN" and app.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to upload documents for another citizen's application."
        )

    # Validate extension
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format '{file_ext}'. Allowed formats: PDF, JPG, PNG."
        )

    # Read and validate file size
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size limit of 10 MB."
        )

    # Save to disk
    app_folder = UPLOAD_DIR / application_id
    app_folder.mkdir(parents=True, exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = app_folder / safe_filename

    with open(file_path, "wb") as f:
        f.write(contents)

    # Check if document already exists for this application
    existing_doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.application_id == application_id,
        ((ApplicationDocument.id == documentId) | 
         (ApplicationDocument.id == f"{application_id}_{documentId}") |
         (ApplicationDocument.document_type == documentName))
    ).first()

    if existing_doc:
        existing_doc.file_name = file.filename
        existing_doc.file_path = str(file_path)
        existing_doc.mime_type = file.content_type
        existing_doc.file_size = file_size
        existing_doc.status = "VERIFIED"
        doc_record = existing_doc
    else:
        # Determine unique primary key
        target_id = documentId
        if db.query(ApplicationDocument).filter(ApplicationDocument.id == target_id).first():
            target_id = f"{application_id}_{documentId}"
            if db.query(ApplicationDocument).filter(ApplicationDocument.id == target_id).first():
                target_id = f"{application_id}_{uuid.uuid4().hex[:8]}"

        doc_record = ApplicationDocument(
            id=target_id,
            application_id=application_id,
            document_type=documentName,
            file_name=file.filename or "uploaded_file",
            file_path=str(file_path),
            mime_type=file.content_type,
            file_size=file_size,
            status="VERIFIED",
            verification_result={"match": True, "note": "Pre-validation checks passed."}
        )
        db.add(doc_record)

    db.commit()
    db.refresh(doc_record)

    return DocumentItemSchema(
        documentId=documentId,
        documentName=doc_record.document_type,
        fileName=doc_record.file_name,
        fileSize=doc_record.file_size or 0,
        fileType=doc_record.mime_type or "application/pdf",
        status=doc_record.status,
        uploadedAt=doc_record.uploaded_at.isoformat() if doc_record.uploaded_at else "",
        verificationResult=doc_record.verification_result
    )

@router.get("", response_model=List[DocumentItemSchema])
def get_documents(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    if current_user.role.upper() == "CITIZEN" and app.citizen_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    if current_user.role.upper() == "OFFICER" and app.department_id != current_user.department_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return [
        DocumentItemSchema(
            documentId=d.id,
            documentName=d.document_type,
            fileName=d.file_name,
            fileSize=d.file_size or 0,
            fileType=d.mime_type or "application/pdf",
            status=d.status,
            uploadedAt=d.uploaded_at.isoformat() if d.uploaded_at else "",
            verificationResult=d.verification_result
        ) for d in app.documents
    ]
