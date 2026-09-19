import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { authService } from '../mock/auth';
import {
  applicationService,
  mergeApplicationsIntoStorage,
  type ApplicationRecord
} from '../mock/applicationService';
import { apiClient } from '../services/apiClient';
import {
  ArrowLeft,
  AlertTriangle,
  Award,
  FolderOpen,
  PlayCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Send,
  Edit3,
  X,
  FileText,
  Building,
  User,
  AlertCircle,
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react';


// ─────────────────────────────────────────────
// Timeline event config
// ─────────────────────────────────────────────
const ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  APPLICATION_CREATED: { label: 'Application Created', color: '#6B7280', icon: '📝' },
  APPLICATION_SUBMITTED: { label: 'Application Submitted', color: '#3B82F6', icon: '📤' },
  APPLICATION_RESUBMITTED: { label: 'Application Resubmitted', color: '#8B5CF6', icon: '🔄' },
  CORRECTION_REQUESTED: { label: 'Correction Requested', color: '#F59E0B', icon: '⚠️' },
  APPLICATION_APPROVED: { label: 'Application Approved', color: '#10B981', icon: '✅' },
  APPLICATION_REJECTED: { label: 'Application Rejected', color: '#EF4444', icon: '❌' },
  MOVED_TO_REVIEW: { label: 'Moved to Officer Review', color: '#3B82F6', icon: '👤' },
};

interface TimelineEvent {
  id: string;
  actionType: string;
  description: string;
  actorName: string | null;
  timestamp: string;
}

// ─────────────────────────────────────────────
// Correction Edit Modal
// ─────────────────────────────────────────────
interface CorrectionModalProps {
  app: ApplicationRecord;
  officerRemarks: string;
  onClose: () => void;
  onResubmit: (updatedData: Record<string, any>) => void;
  isSubmitting: boolean;
}

const CorrectionModal: React.FC<CorrectionModalProps> = ({
  app,
  officerRemarks,
  onClose,
  onResubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    applicantName: app.formData?.applicantName || '',
    email: app.formData?.email || '',
    mobile: app.formData?.mobile || '',
    address: app.formData?.address || '',
    businessName: app.formData?.businessName || '',
    businessAddress: app.formData?.businessAddress || app.formData?.premisesAddress || '',
    businessType: app.formData?.businessType || '',
    city: app.formData?.city || '',
    pincode: app.formData?.pincode || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only pass non-empty fields
    const cleaned: Record<string, string> = {};
    Object.entries(formData).forEach(([k, v]) => {
      if (v.trim()) cleaned[k] = v.trim();
    });
    onResubmit(cleaned);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.9rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginBottom: '0.3rem',
    display: 'block'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '2rem'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Edit3 size={20} color="#F59E0B" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Fix &amp; Resubmit Application
              </h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {app.id} — {app.serviceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Officer Remarks Banner */}
        <div style={{
          padding: '1rem 1.2rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: 600, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Officer Correction Remarks
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {officerRemarks}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Applicant Full Name</label>
              <input style={inputStyle} value={formData.applicantName} onChange={e => handleChange('applicantName', e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input style={inputStyle} type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="Email address" />
            </div>
            <div>
              <label style={labelStyle}>Mobile Number</label>
              <input style={inputStyle} value={formData.mobile} onChange={e => handleChange('mobile', e.target.value)} placeholder="Mobile number" />
            </div>
            <div>
              <label style={labelStyle}>Residential Address</label>
              <input style={inputStyle} value={formData.address} onChange={e => handleChange('address', e.target.value)} placeholder="Residential address" />
            </div>
            {app.formData?.businessName !== undefined && (
              <div>
                <label style={labelStyle}>Business / Establishment Name</label>
                <input style={inputStyle} value={formData.businessName} onChange={e => handleChange('businessName', e.target.value)} placeholder="Business name" />
              </div>
            )}
            {(app.formData?.businessAddress !== undefined || app.formData?.premisesAddress !== undefined) && (
              <div>
                <label style={labelStyle}>Business / Premises Address</label>
                <input style={inputStyle} value={formData.businessAddress} onChange={e => handleChange('businessAddress', e.target.value)} placeholder="Business address" />
              </div>
            )}
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={formData.city} onChange={e => handleChange('city', e.target.value)} placeholder="City" />
            </div>
            <div>
              <label style={labelStyle}>Pincode</label>
              <input style={inputStyle} value={formData.pincode} onChange={e => handleChange('pincode', e.target.value)} placeholder="Pincode" maxLength={6} />
            </div>
          </div>

          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> After resubmission, your application will be routed back to the officer queue for re-review. Ensure all corrected fields address the officer's remarks.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}
              style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSubmitting ? (
                <><Loader2 size={16} className="spin" /> Resubmitting...</>
              ) : (
                <><Send size={16} /> Resubmit Application</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────
export const ApplicationDetailsPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);
  const { user: authUser } = useAuth();
  const currentUser = authUser || authService.getCurrentUser();

  const loadApp = useCallback(() => {
    if (applicationId) {
      const found = applicationService.getApplicationById(applicationId);
      if (found) setApp(found);

      apiClient.get<ApplicationRecord>(`/applications/${applicationId}`).then((res) => {
        if (res.ok && res.data) {
          setApp(res.data);
          mergeApplicationsIntoStorage([res.data]);
        }
      }).catch(() => {});
    }
  }, [applicationId]);

  useEffect(() => {
    loadApp();

    // Listen for storage updates (e.g., from officer actions or resubmit)
    const handler = () => loadApp();
    window.addEventListener('govease_applications_updated', handler);
    return () => window.removeEventListener('govease_applications_updated', handler);
  }, [loadApp]);

  // Load timeline
  useEffect(() => {
    if (!applicationId) return;
    setTimelineLoading(true);
    applicationService.getApplicationTimeline(applicationId)
      .then(events => setTimeline(events))
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoading(false));
  }, [applicationId, app?.status]);

  const isUnauthorized =
    app &&
    currentUser &&
    currentUser.role === 'citizen' &&
    app.userId !== currentUser.id;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  };

  const handleResubmit = async (updatedData: Record<string, any>) => {
    if (!app) return;
    setIsResubmitting(true);
    try {
      const updated = applicationService.resubmitApplication(app.id, updatedData);
      setApp(updated);
      setResubmitSuccess(true);
      setShowCorrectionModal(false);
      // Reload timeline
      const events = await applicationService.getApplicationTimeline(app.id);
      setTimeline(events);
    } catch (err) {
      console.error('Resubmit failed:', err);
    } finally {
      setIsResubmitting(false);
    }
  };

  // ── Not found / unauthorized ──────────────────
  if (!app || isUnauthorized) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '3rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <AlertCircle size={40} color="var(--status-danger)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isUnauthorized ? 'Access Denied' : 'Application Not Found'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {isUnauthorized
                ? 'You do not have permission to view this application.'
                : `The application reference "${applicationId}" does not exist or does not belong to your account.`}
            </p>
            <Link to="/applications" className="btn btn-primary">
              <ArrowLeft size={16} /> Return to My Applications
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isApproved = app.status === 'APPROVED' || app.status === 'DIGITAL_APPROVAL';
  const isRejected = app.status === 'REJECTED';
  const isCorrectionRequired = app.status === 'CORRECTION_REQUIRED';
  const isDraft = app.status === 'DRAFT';
  const isUnderReview = app.status === 'OFFICER_REVIEW' || app.status === 'RESUBMITTED';

  // ── Main render ───────────────────────────────
  return (
    <DashboardLayout>
      {showCorrectionModal && (
        <CorrectionModal
          app={app}
          officerRemarks={app.officerRemarks || app.remarks || 'Please review and correct the flagged information.'}
          onClose={() => setShowCorrectionModal(false)}
          onResubmit={handleResubmit}
          isSubmitting={isResubmitting}
        />
      )}

      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

        {/* Breadcrumb nav */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/applications"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.85rem', color: 'var(--text-secondary)',
              textDecoration: 'none', fontWeight: 500
            }}
          >
            <ArrowLeft size={16} /> Back to My Applications
          </Link>
        </div>

        {/* ── Resubmit Success Banner ── */}
        {resubmitSuccess && (
          <div style={{
            padding: '1rem 1.25rem', marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <CheckCircle2 size={20} color="#10B981" />
            <div>
              <strong style={{ color: '#10B981', fontSize: '0.9rem' }}>Application Resubmitted Successfully</strong>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Your corrected application has been routed back to the officer queue for re-review.
              </p>
            </div>
          </div>
        )}

        {/* ── Application Header Card ── */}
        <div className="glass-panel" style={{
          padding: '2rem', marginBottom: '1.5rem',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                <h1 style={{ fontSize: '1.55rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                  {app.serviceName}
                </h1>
                <span className={`badge ${applicationService.getStatusBadgeClass(app.status)}`}>
                  {applicationService.getStatusLabel(app.status)}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: <strong style={{ color: 'var(--text-secondary)' }}>{app.id}</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Filed: <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(app.createdAt)}</strong>
                </div>
                {app.department && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Building size={13} /> <strong style={{ color: 'var(--text-secondary)' }}>{app.department}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                to={`/applications/${app.id}/assistant`}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.85rem',
                  padding: '0.6rem 1.1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderColor: 'rgba(6, 182, 212, 0.4)',
                  color: 'var(--accent-cyan)'
                }}
                title="Ask AI Assistant about this application"
              >
                <Sparkles size={16} /> Ask AI Assistant
              </Link>
              {isDraft && (
                <Link
                  to={applicationService.getApplicationResumeRoute(app)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.6rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <PlayCircle size={16} /> Continue Application
                </Link>
              )}

              {isCorrectionRequired && (
                <button
                  onClick={() => setShowCorrectionModal(true)}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.85rem', padding: '0.6rem 1.1rem',
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    border: 'none', cursor: 'pointer'
                  }}
                >
                  <Edit3 size={16} /> Fix &amp; Resubmit
                </button>
              )}
              <Link
                to={`/applications/${app.id}/documents`}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.6rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FolderOpen size={16} /> Documents
              </Link>
              {isApproved && (
                <Link
                  to={`/applications/${app.id}/approval`}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.85rem', padding: '0.6rem 1.1rem',
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  }}
                >
                  <Award size={16} /> Digital Approval
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Status Banners ── */}

        {/* CORRECTION REQUIRED */}
        {isCorrectionRequired && (
          <div className="glass-panel" style={{
            padding: '1.35rem 1.5rem', marginBottom: '1.5rem',
            background: 'rgba(245, 158, 11, 0.07)',
            border: '1px solid rgba(245, 158, 11, 0.4)'
          }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={22} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 0.35rem 0', fontWeight: 700 }}>
                  Action Required — Correction Requested by Officer
                </h3>
                {app.officerDecidedBy && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                    Requested by: <strong style={{ color: 'var(--text-secondary)' }}>{app.officerDecidedBy}</strong>
                    {app.officerDecidedAt ? ` on ${formatDate(app.officerDecidedAt)}` : ''}
                  </p>
                )}
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6
                }}>
                  {app.officerRemarks || app.remarks || 'Please review the flagged information and resubmit with corrections.'}
                </div>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="btn btn-primary"
                    style={{
                      fontSize: '0.85rem', padding: '0.6rem 1.2rem',
                      background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      border: 'none', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '0.45rem'
                    }}
                  >
                    <Edit3 size={15} /> Fix &amp; Resubmit Application
                  </button>
                  <Link
                    to={`/applications/${app.id}/documents`}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.6rem 1.1rem' }}
                  >
                    <FolderOpen size={15} /> Update Documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UNDER REVIEW */}
        {isUnderReview && (
          <div className="glass-panel" style={{
            padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
            background: 'rgba(59, 130, 246, 0.07)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <Clock size={22} color="#3B82F6" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.2rem 0', fontWeight: 700 }}>
                  {app.status === 'RESUBMITTED' ? 'Resubmission Under Officer Review' : 'Under Officer Review'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {app.status === 'RESUBMITTED'
                    ? 'Your corrected application has been received and is being reviewed by the officer.'
                    : 'Your application is currently being reviewed by the designated officer. You will be notified of the decision.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* APPROVED */}
        {isApproved && (
          <div className="glass-panel" style={{
            padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
            background: 'rgba(16, 185, 129, 0.07)',
            border: '1px solid rgba(16, 185, 129, 0.35)'
          }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={22} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.2rem 0', fontWeight: 700 }}>
                  Application Approved
                </h3>
                {app.approvalReference && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.2rem 0' }}>
                    Approval Reference: <strong style={{ color: '#10B981', fontFamily: 'var(--font-mono)' }}>{app.approvalReference}</strong>
                  </p>
                )}
                {app.officerDecidedBy && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Approved by {app.officerDecidedBy} on {formatDate(app.officerDecidedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REJECTED */}
        {isRejected && (
          <div className="glass-panel" style={{
            padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.07)',
            border: '1px solid rgba(239, 68, 68, 0.35)'
          }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <XCircle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.3rem 0', fontWeight: 700 }}>
                  Application Rejected
                </h3>
                <div style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  marginBottom: '0.75rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>Reason:</strong> {app.officerRemarks || app.remarks || 'Application did not meet statutory requirements.'}
                  </p>
                </div>
                {app.officerDecidedBy && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Decision by {app.officerDecidedBy} on {formatDate(app.officerDecidedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Main content: 2-column on desktop ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}
          className="details-grid">
          <style>{`@media(max-width:860px){.details-grid{grid-template-columns:1fr!important}}`}</style>

          {/* LEFT: Application Summary + Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Application Data */}
            <div className="glass-panel" style={{ padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={17} /> Application Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Applicant Name', value: app.formData?.applicantName },
                  { label: 'Email', value: app.formData?.email },
                  { label: 'Mobile', value: app.formData?.mobile },
                  { label: 'Department', value: app.department },
                  { label: 'Business Name', value: app.formData?.businessName },
                  { label: 'Business Address', value: app.formData?.businessAddress || app.formData?.premisesAddress },
                  { label: 'City', value: app.formData?.city },
                  { label: 'Pincode', value: app.formData?.pincode },
                  { label: 'Business Type', value: app.formData?.businessType || app.formData?.tradeType },
                  { label: 'Submitted At', value: formatDate(app.submittedAt) },
                  { label: 'AI Verification', value: app.aiVerificationSummary },
                  ...(isApproved ? [{ label: 'Approval Reference', value: app.approvalReference }] : []),
                ].filter(f => f.value).map(field => (
                  <div key={field.label}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="glass-panel" style={{ padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={17} /> Application Activity Timeline
              </h3>

              {timelineLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Loader2 size={16} className="spin" /> Loading timeline...
                </div>
              ) : timeline.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No activity recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {timeline.map((event, idx) => {
                    const cfg = ACTION_CONFIG[event.actionType] || { label: event.actionType, color: '#6B7280', icon: '•' };
                    const isLast = idx === timeline.length - 1;
                    return (
                      <div key={event.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                        {/* Left column: dot + line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '24px' }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: `${cfg.color}22`, border: `2px solid ${cfg.color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', flexShrink: 0
                          }}>
                            {cfg.icon}
                          </div>
                          {!isLast && (
                            <div style={{ width: '2px', flex: 1, minHeight: '24px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                          )}
                        </div>
                        {/* Right column: content */}
                        <div style={{ paddingBottom: isLast ? 0 : '1.25rem', flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0', lineHeight: 1.5 }}>{event.description}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {event.actorName && <span><User size={10} style={{ display: 'inline', marginRight: '3px' }} />{event.actorName}</span>}
                            <span>{formatDate(event.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Processing Milestones + Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Processing Milestones */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                Processing Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  {
                    title: 'Application Submitted',
                    done: !!app.submittedAt || !isDraft,
                    active: false,
                    pending: isDraft
                  },
                  {
                    title: 'AI Document Verification',
                    done: !isDraft && app.status !== 'DRAFT',
                    active: app.status === 'AI_PROCESSING',
                    pending: isDraft
                  },
                  {
                    title: 'Officer Review',
                    done: isApproved || isRejected,
                    active: isUnderReview,
                    pending: isDraft,
                    attention: isCorrectionRequired,
                    attentionLabel: 'Correction Requested'
                  },
                  {
                    title: 'Final Decision',
                    done: isApproved || isRejected,
                    active: false,
                    pending: !isApproved && !isRejected
                  },
                  {
                    title: 'Digital Approval Issued',
                    done: isApproved,
                    active: false,
                    pending: !isApproved
                  }
                ].map((step, idx) => {
                  let dotColor = 'var(--text-muted)';
                  let dotBg = 'var(--bg-secondary)';
                  let dotBorder = 'var(--border-subtle)';
                  let symbol = `${idx + 1}`;

                  if (step.done) { dotColor = '#10B981'; dotBg = 'rgba(16,185,129,0.15)'; dotBorder = '#10B981'; symbol = '✓'; }
                  else if (step.attention) { dotColor = '#F59E0B'; dotBg = 'rgba(245,158,11,0.15)'; dotBorder = '#F59E0B'; symbol = '!'; }
                  else if (step.active) { dotColor = '#3B82F6'; dotBg = 'rgba(59,130,246,0.15)'; dotBorder = '#3B82F6'; symbol = '●'; }

                  return (
                    <div key={step.title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: dotBg, border: `2px solid ${dotBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: dotColor, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                      }}>
                        {symbol}
                      </div>
                      <div style={{ paddingTop: '2px' }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: step.pending && !step.active ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {step.title}
                        </div>
                        {step.attention && step.attentionLabel && (
                          <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600, marginTop: '0.1rem' }}>
                            {step.attentionLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <Link
                  to={`/applications/${app.id}/documents`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderOpen size={15} /> View Documents
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </Link>

                {isDraft && (
                  <Link
                    to={applicationService.getApplicationResumeRoute(app)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <PlayCircle size={15} /> Continue Application
                    </span>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </Link>
                )}

                {isCorrectionRequired && (
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      cursor: 'pointer',
                      color: '#F59E0B',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Edit3 size={15} /> Fix &amp; Resubmit
                    </span>
                    <ChevronRight size={14} />
                  </button>
                )}

                {isApproved && (
                  <Link
                    to={`/applications/${app.id}/approval`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      textDecoration: 'none',
                      color: '#10B981',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={15} /> Digital Approval
                    </span>
                    <ChevronRight size={14} />
                  </Link>
                )}

                <Link
                  to="/assistant"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={15} /> AI Assistance
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetailsPage;
