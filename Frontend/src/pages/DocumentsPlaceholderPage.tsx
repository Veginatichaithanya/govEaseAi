import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { authService } from '../mock/auth';
import { applicationService, type DocumentUpload } from '../mock/applicationService';
import { MOCK_SERVICES } from '../mock/services';
import {
  Files,
  Sparkles,
  ClipboardCheck,
  Send,
  Lock,
  ArrowLeft,
  ArrowRight,
  Upload,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Trash2,
  ShieldCheck
} from 'lucide-react';

function formatFileSize(bytes: number | string): string {
  const n = typeof bytes === 'number' ? bytes : parseInt(bytes, 10);
  if (isNaN(n) || n <= 0) return 'Verified File';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const DocumentsPlaceholderPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const application = applicationId
    ? applicationService.getApplicationById(applicationId)
    : null;

  // Lookup service configuration for required documents
  const service = application ? MOCK_SERVICES.find((s) => s.id === application.serviceId) : null;
  const requiredDocs = service?.requiredDocuments || [
    { id: 'doc-identity', name: 'Identity Proof (Aadhaar / Voter ID)', required: true, description: 'Official government-issued identity document showing name and DOB.', type: 'PDF' },
    { id: 'doc-address', name: 'Address / Rental Agreement Deed', required: true, description: 'Registered lease deed or recent electricity bill for commercial premises.', type: 'PDF' },
    { id: 'doc-photo', name: 'Applicant Passport Photograph', required: true, description: 'Recent colour photograph with plain white background.', type: 'IMAGE' },
    { id: 'doc-pan', name: 'PAN Card / Business Tax Proof', required: false, description: 'Permanent Account Number card of proprietor or enterprise.', type: 'PDF' }
  ];

  // Local state for uploaded documents
  const [uploadedDocs, setUploadedDocs] = useState<DocumentUpload[]>(() => {
    return application?.uploadedDocuments || [];
  });
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 5-Step Progress Definition
  const steps = [
    { num: 1, name: 'Application Details', icon: CheckCircle2, completed: true, active: false },
    { num: 2, name: 'Documents', icon: Files, completed: false, active: true },
    { num: 3, name: 'AI Verification', icon: Sparkles, completed: false, locked: true },
    { num: 4, name: 'Review', icon: ClipboardCheck, completed: false, locked: true },
    { num: 5, name: 'Submit', icon: Send, completed: false, locked: true }
  ];

  // Missing or Unauthorized Application State (Ownership Check)
  const isUnauthorized = application && currentUser && currentUser.role === 'citizen' && application.userId !== currentUser.id;

  if (!application || isUnauthorized) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: '600px', textAlign: 'center', margin: '4rem auto' }}>
          <div
            className="glass-panel"
            style={{
              padding: '3.5rem 2rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'var(--bg-card)'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <AlertCircle size={30} />
            </div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--heading-color)', marginBottom: '0.75rem' }}>
              {isUnauthorized ? 'Access Denied' : 'Application Not Found'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              {isUnauthorized
                ? 'You do not have permission to view this application.'
                : `No active application was found matching identifier "${applicationId}". Please verify the application ID or initiate a new application.`}
            </p>
            <Link to="/services" className="btn btn-primary">
              <ArrowLeft size={16} /> Back to Services
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle Mock or Real File Upload
  const handleFileChange = (docId: string, docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`File "${file.name}" exceeds 10MB limit.`);
      return;
    }

    setUploadError(null);
    setUploadingDocId(docId);

    setTimeout(() => {
      const newDoc: DocumentUpload = {
        documentId: docId,
        documentName: docName,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'VERIFIED'
      };

      const updated = [...uploadedDocs.filter(d => d.documentId !== docId), newDoc];
      setUploadedDocs(updated);
      setUploadingDocId(null);
      setUploadSuccessMsg(`Successfully uploaded and verified ${docName}`);

      // Persist to mock applicationService
      try {
        applicationService.updateApplication(application.id, {
          uploadedDocuments: updated,
          status: 'AI_PROCESSING'
        });
      } catch (err) {
        console.warn('Failed to update application records:', err);
      }

      setTimeout(() => setUploadSuccessMsg(null), 4000);
    }, 700);
  };

  const handleRemoveDoc = (docId: string) => {
    const updated = uploadedDocs.filter(d => d.documentId !== docId);
    setUploadedDocs(updated);
    try {
      applicationService.updateApplication(application.id, {
        uploadedDocuments: updated
      });
    } catch (err) {
      console.warn('Failed to remove document:', err);
    }
  };

  const mandatoryCount = requiredDocs.filter(d => d.required).length;
  const uploadedMandatoryCount = requiredDocs.filter(d => d.required && uploadedDocs.some(u => u.documentId === d.id)).length;
  const canProceed = uploadedMandatoryCount >= Math.min(1, mandatoryCount);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to={`/applications/${application.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--text-secondary)',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              transition: 'color 0.2s'
            }}
          >
            <ArrowLeft size={16} /> Back to Application Overview
          </Link>
        </div>

        {/* 5-Step Progress Indicator (Theme Adaptive) */}
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            marginBottom: '1.75rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.65rem',
              alignItems: 'center'
            }}
          >
            {steps.map((step) => (
              <div
                key={step.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: step.active
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(37, 99, 235, 0.12) 100%)'
                    : step.completed
                    ? 'var(--status-success-bg)'
                    : 'var(--bg-secondary)',
                  border: step.active
                    ? '1px solid var(--accent-cyan)'
                    : step.completed
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid var(--border-subtle)',
                  opacity: step.locked ? 0.65 : 1
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: step.active
                      ? 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)'
                      : step.completed
                      ? '#10B981'
                      : 'var(--border-subtle)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}
                >
                  {step.completed ? <CheckCircle2 size={16} /> : step.locked ? <Lock size={13} /> : step.num}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: step.active ? 700 : 600,
                      color: step.active ? 'var(--accent-blue)' : step.completed ? 'var(--status-success)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {step.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: step.active ? 'var(--accent-cyan)' : step.completed ? 'var(--status-success)' : 'var(--text-muted)'
                    }}
                  >
                    {step.completed ? 'Completed' : step.active ? 'Current Step' : 'Locked'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Document Workspace Card (High Contrast Theme-Aware) */}
        <div
          className="glass-panel"
          style={{
            padding: '2.5rem 2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Header Banner */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                marginBottom: '1rem'
              }}
            >
              <Files size={32} />
            </div>

            <div
              className="section-eyebrow"
              style={{
                background: 'rgba(6, 182, 212, 0.1)',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                color: 'var(--accent-cyan)',
                marginBottom: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Clock size={12} />
              STEP 2: DOCUMENT UPLOAD & AI VERIFICATION
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.2rem)',
                color: 'var(--heading-color)',
                marginBottom: '0.65rem',
                fontWeight: 800
              }}
            >
              Document Verification Desk
            </h1>

            <p
              style={{
                fontSize: '0.98rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '620px',
                margin: '0 auto'
              }}
            >
              Upload your required identity and business documents below. GovEaseAI multimodal vision parses each document, cross-matches identity attributes, and prepares your application for officer scrutiny.
            </p>
          </div>

          {/* Application Details Summary Chip (Theme Adaptive) */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '680px',
              margin: '0 auto 2.25rem auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              textAlign: 'left'
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                Application ID
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--accent-blue)'
                }}
              >
                {application.id}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                Service Name
              </span>
              <span
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
              >
                {application.serviceName}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                Applicant
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {application.formData?.applicantName || application.formData?.fullName || currentUser?.fullName || 'Veginati Chaithanya'}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                Verification Status
              </span>
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--status-warning-bg)',
                  color: 'var(--status-warning)',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                {application.status}
              </span>
            </div>
          </div>

          {/* Feedback alerts */}
          {uploadSuccessMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-success-bg)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: 'var(--status-success)',
                fontSize: '0.88rem'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {uploadError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '0.88rem'
              }}
            >
              <AlertCircle size={18} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Interactive Document Checklist & Uploader */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--heading-color)' }}>
                Required Documents Checklist
              </h3>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  color: canProceed ? 'var(--status-success)' : 'var(--text-muted)',
                  fontWeight: 600
                }}
              >
                {uploadedDocs.length} of {requiredDocs.length} Uploaded
              </span>
            </div>

            {requiredDocs.map((doc) => {
              const uploaded = uploadedDocs.find(d => d.documentId === doc.id);
              const isUploading = uploadingDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: uploaded
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: uploaded ? 'var(--status-success-bg)' : 'var(--bg-card)',
                          color: uploaded ? 'var(--status-success)' : 'var(--accent-blue)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {uploaded ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--heading-color)' }}>
                            {doc.name}
                          </span>
                          {doc.required ? (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#EF4444',
                                border: '1px solid rgba(239, 68, 68, 0.25)'
                              }}
                            >
                              MANDATORY
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                background: 'var(--bg-card)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              OPTIONAL
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                          {doc.description}
                        </p>
                      </div>
                    </div>

                    {/* Upload / Status Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={el => { fileInputRefs.current[doc.id] = el; }}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(doc.id, doc.name, e)}
                      />

                      {uploaded ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--status-success)',
                                fontWeight: 600,
                                background: 'var(--status-success-bg)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-pill)',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              <ShieldCheck size={14} /> {uploaded.fileName} ({formatFileSize(uploaded.fileSize)})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Remove uploaded file"
                              aria-label="Remove document"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.72rem',
                              color: 'var(--accent-cyan)',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            <Sparkles size={12} />
                            <span>Verified by AI (MATCH • 98% Confidence)</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[doc.id]?.click()}
                          disabled={isUploading}
                          className="btn btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.45rem 0.95rem',
                            fontSize: '0.82rem',
                            cursor: isUploading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Upload size={14} />
                          {isUploading ? 'Validating...' : 'Upload File'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <Link
              to={`/applications/${application.id}`}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <ArrowLeft size={16} /> Back to Application
            </Link>

            <button
              type="button"
              onClick={() => navigate(`/applications/${application.id}`)}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.75rem'
              }}
            >
              Proceed to AI Verification & Tracking <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentsPlaceholderPage;
