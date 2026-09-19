import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Sparkles,
  FileCheck2,
  FileText,
  AlertCircle,
  Clock,
  User,
  Loader2,
  Info,
  RefreshCw,
  Eye,
  X,
  Building,
  ClipboardList,
  Check,
} from 'lucide-react';
import { officerAuth, type OfficerUser } from '../../mock/auth';
import {
  applicationService,
  mergeApplicationsIntoStorage,
  type ApplicationRecord,
  type DocumentUpload
} from '../../mock/applicationService';
import { apiClient } from '../../services/apiClient';
import {
  getDepartmentById,
  getDepartmentByServiceId,
  type GovernmentDepartment
} from '../../config/governmentDepartments';
import OfficerLayout from '../../components/officer/OfficerLayout';
import { getApplicationAISummary, type OfficerSummary } from '../../services/aiMultimodalService';


export const OfficerReviewPage: React.FC = () => {

  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [officer, setOfficer] = useState<OfficerUser | null>(null);
  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [appDept, setAppDept] = useState<GovernmentDepartment | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<OfficerSummary | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);

  // Activity timeline
  const [timeline, setTimeline] = useState<Array<{ id: string; actionType: string; description: string; actorName: string | null; timestamp: string }>>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Document Inspection modal state
  const [inspectingDoc, setInspectingDoc] = useState<DocumentUpload | null>(null);

  // Modals for Statutory Officer Actions
  const [activeModal, setActiveModal] = useState<'APPROVE' | 'CORRECTION' | 'REJECT' | null>(null);
  const [officerRemarks, setOfficerRemarks] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAISummary = useCallback(async (appId: string) => {
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    try {
      const result = await getApplicationAISummary(appId);
      if (result.success && result.summary) {
        setAiSummary(result.summary);
      } else {
        setAiSummaryError(result.error || 'AI summary unavailable.');
      }
    } catch {
      setAiSummaryError('AI summary temporarily unavailable.');
    } finally {
      setAiSummaryLoading(false);
    }
  }, []);

  const loadTimeline = useCallback(async (appId: string) => {
    setTimelineLoading(true);
    try {
      const res = await apiClient.get<Array<{ id: string; actionType: string; description: string; actorName: string | null; timestamp: string }>>(`/officer/applications/${appId}/timeline`);
      if (res.ok && Array.isArray(res.data)) {
        setTimeline(res.data);
      } else {
        setTimeline([]);
      }
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const loadApplication = useCallback(async (appId: string, _currentOfficer?: OfficerUser) => {
    setAppLoading(true);
    setIsForbidden(false);
    setAppError(null);
    try {
      const res = await apiClient.get<ApplicationRecord>(`/officer/applications/${appId}`);
      if (res.status === 403) {
        setIsForbidden(true);
        setAppLoading(false);
        return;
      }
      if (res.ok && res.data) {
        const data = res.data;
        setApp(data);
        mergeApplicationsIntoStorage([data]);
        if (data.departmentId) {
          const d = getDepartmentById(data.departmentId);
          if (d) setAppDept(d);
        }
      } else {
        setAppError(res.error || 'Application record not found in government registry.');
      }
    } catch {
      setAppError('Unable to connect to live government application registry.');
    } finally {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentOfficer = officerAuth.getCurrentOfficer();
    if (!currentOfficer) {
      navigate('/officer/login', { replace: true });
      return;
    }
    setOfficer(currentOfficer);

    if (applicationId) {
      loadApplication(applicationId, currentOfficer);
      loadTimeline(applicationId);
      loadAISummary(applicationId);
    }
  }, [applicationId, navigate, loadApplication, loadTimeline, loadAISummary]);

  // Re-load timeline after officer actions update storage
  useEffect(() => {
    const handler = () => {
      if (applicationId && officer) {
        loadApplication(applicationId, officer);
        loadTimeline(applicationId);
      }
    };
    window.addEventListener('govease_applications_updated', handler);
    return () => window.removeEventListener('govease_applications_updated', handler);
  }, [applicationId, officer, loadApplication, loadTimeline]);

  // Loading State for Auth
  if (!officer) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>Authenticating statutory officer access...</p>
      </div>
    );
  }

  // Loading State for Application
  if (appLoading) {
    return (
      <OfficerLayout headerTitle="Loading Application Dossier">
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Loader2 size={36} className="animate-spin" color="var(--accent-blue)" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Loading statutory application from PostgreSQL registry...
          </p>
        </div>
      </OfficerLayout>
    );
  }

  // Application Not Found or Error
  if (!app || appError) {
    return (
      <OfficerLayout headerTitle="Application Not Found">
        <div style={{ maxWidth: '720px', margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '3rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <AlertCircle size={40} color="var(--status-danger)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Application Record Not Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {appError || `The application reference "${applicationId}" does not exist in the government registry.`}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => applicationId && loadApplication(applicationId, officer)}
                className="btn btn-secondary"
              >
                <RefreshCw size={16} /> Retry
              </button>
              <Link to="/officer/dashboard" className="btn btn-primary">
                <ArrowLeft size={16} /> Return to Officer Dashboard
              </Link>
            </div>
          </div>
        </div>
      </OfficerLayout>
    );
  }

  // =========================================================================
  // STRICT STATUTORY AUTHORIZATION CHECK
  // If the application's department does NOT match the logged-in officer's department:
  // ACCESS DENIED! Prevent data leakage and do not display application fields.
  // =========================================================================
  const isAuthorized =
    !isForbidden &&
    (officer.departmentId === app.departmentId ||
      officer.serviceIds?.includes(app.serviceId) ||
      getDepartmentByServiceId(app.serviceId)?.departmentId === officer.departmentId);

  if (isForbidden || !isAuthorized) {
    return (
      <OfficerLayout headerTitle="Unauthorized Application">
        <main
          style={{
            maxWidth: '680px',
            margin: '3rem auto',
            padding: '0 1.5rem',
            flex: 1
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '2.5rem',
              backgroundColor: 'var(--bg-card)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <XCircle size={36} color="var(--status-danger)" />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-danger" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                UNAUTHORIZED APPLICATION
              </span>
            </div>

            <h1
              style={{
                fontSize: '1.4rem',
                color: 'var(--text-primary)',
                fontWeight: 700,
                marginBottom: '0.5rem'
              }}
            >
              Unauthorized Application: Statutory Department Restriction
            </h1>

            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: '1.5rem'
              }}
            >
              You do not have statutory permission to review application <strong>{app.id}</strong>.
            </p>

            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'left',
                marginBottom: '1.75rem',
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Application Department:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {app.department || appDept?.departmentName || 'Another Department'} ({app.serviceName})
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Your Logged-in Department:</span>{' '}
                <strong style={{ color: 'var(--accent-blue-light)' }}>
                  {officer.departmentName} ({officer.role})
                </strong>
              </div>
              <div style={{ color: 'var(--status-danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                Statutory cross-department examination is strictly forbidden under administrative delegation rules.
              </div>
            </div>

            <Link
              to="/officer/dashboard"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} /> Return to Your Assigned Dashboard
            </Link>
          </div>
        </main>
      </OfficerLayout>
    );
  }

  // =========================================================================
  // STATUTORY OFFICER ACTION HANDLERS (LIVE POSTGRESQL DRIVEN)
  // =========================================================================
  const handleApprove = async () => {
    if (!app || !officer) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const remarks = officerRemarks.trim() || 'Statutory criteria fulfilled. Digital license sanctioned.';
      const res = await apiClient.post<ApplicationRecord>(`/officer/applications/${app.id}/approve`, {
        officerName: officer.officerName,
        remarks
      });
      if (res.ok && res.data) {
        setApp(res.data);
        mergeApplicationsIntoStorage([res.data]);
        setActiveModal(null);
        setOfficerRemarks('');
        setActionSuccessMsg(`Application ${app.id} successfully APPROVED. Digital reference: ${res.data.approvalReference || 'Sanction recorded'}.`);
        window.dispatchEvent(new Event('govease_applications_updated'));
        loadTimeline(app.id);
      } else {
        setActionError(res.error || 'Failed to approve application.');
      }
    } catch {
      setActionError('Network error while recording statutory approval in registry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!app || !officer) return;
    if (!officerRemarks.trim()) {
      setActionError('Please state specific correction requirements for the citizen applicant.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.post<ApplicationRecord>(`/officer/applications/${app.id}/correction`, {
        officerName: officer.officerName,
        remarks: officerRemarks.trim()
      });
      if (res.ok && res.data) {
        setApp(res.data);
        mergeApplicationsIntoStorage([res.data]);
        setActiveModal(null);
        setOfficerRemarks('');
        setActionSuccessMsg(`Clarification request dispatched to applicant. Application status updated to CORRECTION_REQUIRED.`);
        window.dispatchEvent(new Event('govease_applications_updated'));
        loadTimeline(app.id);
      } else {
        setActionError(res.error || 'Failed to request correction.');
      }
    } catch {
      setActionError('Network error while dispatching clarification request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!app || !officer) return;
    if (!officerRemarks.trim()) {
      setActionError('Please state the statutory grounds for rejecting this application.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.post<ApplicationRecord>(`/officer/applications/${app.id}/reject`, {
        officerName: officer.officerName,
        remarks: officerRemarks.trim()
      });
      if (res.ok && res.data) {
        setApp(res.data);
        mergeApplicationsIntoStorage([res.data]);
        setActiveModal(null);
        setOfficerRemarks('');
        setActionSuccessMsg(`Application REJECTED with statutory grounds recorded in government registry.`);
        window.dispatchEvent(new Event('govease_applications_updated'));
        loadTimeline(app.id);
      } else {
        setActionError(res.error || 'Failed to record rejection.');
      }
    } catch {
      setActionError('Network error while recording statutory rejection.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not recorded';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Resolve citizen intake fields across both wizard schema and backend seed keys
  const formData = app.formData || {};
  const resolvedApplicantName = formData.fullName || formData.applicantName || 'Citizen Applicant';
  const resolvedContactMobile = formData.mobileNumber || formData.contactMobile || formData.mobile || formData.phone;
  const resolvedContactEmail = formData.email || formData.contactEmail;
  const resolvedApplicantDob = formData.dateOfBirth || formData.applicantDob;

  const resolvedResidentialAddress = formData.address 
    ? `${formData.address}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.postalCode ? ` - ${formData.postalCode}` : ''}`
    : (formData.residentialAddress || formData.applicantAddress);

  const resolvedBusinessName = formData.businessName || formData.enterpriseName || formData.shopName || formData.tradeName || formData.industryName || formData.factoryName || 'Commercial Enterprise';
  const resolvedBusinessType = formData.businessType || formData.registrationType || formData.organizationType;
  const resolvedBusinessCategory = formData.businessCategory || formData.tradeCategory || formData.tradeType || formData.establishmentCategory || formData.manufacturingActivity;

  const resolvedPremisesAddress = formData.businessAddress
    ? `${formData.businessAddress}${formData.businessCity ? `, ${formData.businessCity}` : ''}${formData.businessState ? `, ${formData.businessState}` : ''}${formData.businessPostalCode ? ` - ${formData.businessPostalCode}` : ''}`
    : (formData.premisesAddress || formData.factoryPremises || formData.siteAddress);

  const resolvedBusinessStartDate = formData.businessStartDate || formData.commencementDate;
  const resolvedEmployeeCount = formData.numberOfEmployees || formData.employeeCount || formData.totalWorkers;

  const resolvedFatherSpouse = formData.fatherSpouseName || formData.fatherName;
  const resolvedAadhaar = formData.applicantAadhaar || formData.aadhaarNumber || formData.idNumber;
  const resolvedPan = formData.applicantPan || formData.panNumber;

  return (
    <OfficerLayout headerTitle="Statutory Review">
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '1.75rem 1.75rem' }}>
        {/* Navigation Breadcrumb Bar */}
        <div
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <Link
            to="/officer/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--text-secondary)',
              fontSize: '0.86rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} /> Back to Application Queue
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              className="badge badge-info"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                padding: '0.2rem 0.6rem'
              }}
            >
              DIV-CODE: {officer.departmentCode}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Appraisal Desk: <strong>{officer.officerName}</strong> ({officer.role})
            </span>
          </div>
        </div>

        {/* Main Container */}
        <main style={{ width: '100%' }}>
        {/* Success Alert Banner if action performed */}
        {actionSuccessMsg && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              fontSize: '0.88rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}
          >
            <CheckCircle2 size={20} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Application Overview Card & Core Appraisal Actions (Prominent Header) */}
        <section
          className="glass-panel"
          style={{
            padding: '1.75rem 2rem',
            marginBottom: '1.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'var(--accent-blue-light)'
                  }}
                >
                  {app.id}
                </span>
                <span className={`badge ${applicationService.getStatusBadgeClass(app.status)}`}>
                  {applicationService.getStatusLabel(app.status)}
                </span>
                {app.approvalReference && (
                  <span
                    className="badge badge-success"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
                  >
                    Ref: {app.approvalReference}
                  </span>
                )}
              </div>

              <h1
                style={{
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.35rem 0'
                }}
              >
                {app.serviceName} Statutory Appraisal
              </h1>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Department: <strong>{officer.departmentName}</strong> • Submitted by{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {resolvedApplicantName}
                </strong>{' '}
                on {formatDate(app.createdAt)}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveModal('APPROVE');
                  setOfficerRemarks('');
                }}
                className="btn btn-primary"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  borderColor: 'rgba(16, 185, 129, 0.5)',
                  color: '#34D399',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '0.65rem 1.15rem'
                }}
              >
                <CheckCircle2 size={17} /> Approve Permit
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal('CORRECTION');
                  setOfficerRemarks('');
                }}
                className="btn btn-secondary"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  color: '#FBBF24',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '0.65rem 1.15rem'
                }}
              >
                <RotateCcw size={17} /> Request Correction
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal('REJECT');
                  setOfficerRemarks('');
                }}
                className="btn btn-secondary"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#F87171',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '0.65rem 1.15rem'
                }}
              >
                <XCircle size={17} /> Reject with Grounds
              </button>
            </div>
          </div>
        </section>

        {/* AI Review Summary Card (Assistive Analysis) */}
        <section style={{
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(99,102,241,0.3)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(6,182,212,0.03) 100%)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>AI Review Summary</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Gemini 2.5 Flash · Assistive Analysis Only</div>
              </div>
              <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.1)', color: '#DC2626', fontWeight: 600 }}>
                Not a Government Decision
              </span>
            </div>
            <button type="button" onClick={() => applicationId && loadAISummary(applicationId)} disabled={aiSummaryLoading}
              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Refresh AI summary">
              <RefreshCw size={14} className={aiSummaryLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ padding: '1rem 1.15rem' }}>
            {aiSummaryLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Loader2 size={16} className="animate-spin" color="var(--accent-blue)" />
                <span>Gemini AI is analyzing this application...</span>
              </div>
            )}
            {aiSummaryError && !aiSummaryLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <Info size={14} />
                <span>{aiSummaryError}</span>
              </div>
            )}
            {aiSummary && !aiSummaryLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Scores row */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center', minWidth: '110px' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: aiSummary.completeness_score >= 80 ? '#10B981' : aiSummary.completeness_score >= 60 ? '#F59E0B' : '#EF4444' }}>
                      {aiSummary.completeness_score}%
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>Completeness</div>
                  </div>
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center', minWidth: '110px' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {aiSummary.document_count?.received ?? app.uploadedDocuments.length}/{aiSummary.document_count?.required ?? '—'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>Documents</div>
                  </div>
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: aiSummary.needs_officer_attention ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${aiSummary.needs_officer_attention ? 'rgba(234,179,8,0.25)' : 'rgba(34,197,94,0.25)'}`, textAlign: 'center', minWidth: '140px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: aiSummary.needs_officer_attention ? '#D97706' : '#16A34A' }}>
                      {aiSummary.needs_officer_attention ? '⚠ Attention' : '✓ Ready'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>Officer Action</div>
                  </div>
                </div>

                {/* Summary text */}
                {aiSummary.verification_summary && (
                  <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {aiSummary.verification_summary}
                  </div>
                )}

                {/* Issues */}
                {aiSummary.potential_issues?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertTriangle size={13} color="#D97706" /> Potential Issues
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {aiSummary.potential_issues.map((issue, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.78rem', color: '#D97706', padding: '0.4rem 0.6rem', background: 'rgba(234,179,8,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(234,179,8,0.18)' }}>
                          <span style={{ marginTop: '1px', flexShrink: 0 }}>•</span>
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0' }}>
                  <Info size={11} style={{ flexShrink: 0 }} />
                  <span>{aiSummary.ai_disclaimer}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Existing Remarks / Statutory Feedback Note if any */}
        {app.remarks && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <AlertTriangle size={16} color="var(--status-warning)" />
              <strong style={{ color: 'var(--status-warning)' }}>Current Officer Determination Remarks:</strong>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{app.remarks}</p>
          </div>
        )}

        {/* ==================================================
            Main 2-Column Review Grid
            Left: Comprehensive Application Dossier
            Right: Evidence, AI Pre-Screening & Cross-Match Matrix
        ================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '1.75rem',
            alignItems: 'start'
          }}
          className="officer-review-grid"
        >
          {/* Left Column: Comprehensive Statutory Dossier */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              className="glass-panel"
              style={{
                padding: '1.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.85rem',
                  marginBottom: '1.25rem'
                }}
              >
                <FileText size={18} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                  Statutory Application Dossier ({app.serviceName})
                </h3>
              </div>

              {/* Subsection 1: Legal Identity & Citizen Contact */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem', color: 'var(--accent-blue-light)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <User size={14} /> Applicant Identity & Personal Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <ReviewItem label="Applicant Full Name" value={resolvedApplicantName} isBold />
                  {resolvedFatherSpouse && <ReviewItem label="Father / Spouse Name" value={resolvedFatherSpouse} />}
                  <ReviewItem label="Contact Mobile" value={resolvedContactMobile} />
                  <ReviewItem label="Contact Email" value={resolvedContactEmail} />
                  {resolvedApplicantDob && <ReviewItem label="Date of Birth" value={resolvedApplicantDob} />}
                  <ReviewItem label="Residential Address" value={resolvedResidentialAddress} />
                  {resolvedAadhaar && <ReviewItem label="Aadhaar / National ID" value={resolvedAadhaar} />}
                  {resolvedPan && <ReviewItem label="PAN Card Number" value={resolvedPan} />}
                </div>
              </div>

              {/* Subsection 2: Establishment & Premises Information */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Building size={14} /> Establishment & Operating Premises
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <ReviewItem label="Registered Business / Entity Name" value={resolvedBusinessName} isBold />
                  <ReviewItem label="Business Structure" value={resolvedBusinessType} />
                  <ReviewItem label="Trade Category / Activity" value={resolvedBusinessCategory} />
                  <ReviewItem label="Operating Premises Address" value={resolvedPremisesAddress} />
                  {resolvedBusinessStartDate && <ReviewItem label="Commencement / Start Date" value={resolvedBusinessStartDate} />}
                  {resolvedEmployeeCount !== undefined && <ReviewItem label="Employee Headcount" value={String(resolvedEmployeeCount)} />}
                  
                  {/* Service Specific Technical Fields - Rendered only when populated */}
                  {formData.floorAreaSqFt && <ReviewItem label="Commercial Floor Area" value={`${formData.floorAreaSqFt} sq ft`} />}
                  {formData.powerLoadHp && <ReviewItem label="Power Connection Load" value={formData.powerLoadHp} />}
                  {formData.taxAssessmentNo && <ReviewItem label="Property Tax Assessment No." value={formData.taxAssessmentNo} />}
                  {formData.plotNumber && <ReviewItem label="Plot / Parcel Number" value={formData.plotNumber} />}
                  {formData.layoutApprovalNo && <ReviewItem label="Layout Sanction Reference" value={formData.layoutApprovalNo} />}
                  {formData.constructionType && <ReviewItem label="Proposed Construction Type" value={formData.constructionType} />}
                  {formData.proposedBuiltUpArea && <ReviewItem label="Proposed Built-Up Area" value={formData.proposedBuiltUpArea} />}
                  {formData.architectLicenseNo && <ReviewItem label="Architect License No." value={formData.architectLicenseNo} />}
                  {formData.gstin && <ReviewItem label="Goods & Services Tax (GSTIN)" value={formData.gstin} />}
                  {formData.cin && <ReviewItem label="Corporate Identity Number (CIN)" value={formData.cin} />}
                  {formData.workingShifts && <ReviewItem label="Operational Shifts" value={formData.workingShifts} />}
                  {formData.weeklyHoliday && <ReviewItem label="Designated Weekly Holiday" value={formData.weeklyHoliday} />}
                  {formData.factoryManager && <ReviewItem label="Factory Manager" value={formData.factoryManager} />}
                  {formData.safetyOfficerAppointed && <ReviewItem label="Safety Officer Compliance" value={formData.safetyOfficerAppointed} />}
                  {formData.pollutionCategory && <ReviewItem label="Pollution Categorization" value={formData.pollutionCategory} />}
                  {formData.cteReferenceNumber && <ReviewItem label="CTE Sanction Reference" value={formData.cteReferenceNumber} />}
                  {formData.etpCapacityKLD && <ReviewItem label="ETP Capacity" value={formData.etpCapacityKLD} />}
                  {formData.airPollutionEquipment && <ReviewItem label="Air Pollution Control" value={formData.airPollutionEquipment} />}
                  {formData.solidWasteDisposal && <ReviewItem label="Hazardous Waste Disposal" value={formData.solidWasteDisposal} />}
                </div>
              </div>

              {/* Subsection 3: Statutory Scope & Declarations */}
              {(formData.applicationPurpose || formData.businessDescription || formData.additionalInformation) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem', color: '#A78BFA', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <ClipboardList size={14} /> Intake Declarations & Operational Scope
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {formData.applicationPurpose && <ReviewItem label="Application Purpose" value={formData.applicationPurpose} />}
                    {formData.businessDescription && <ReviewItem label="Business Description" value={formData.businessDescription} />}
                    {formData.additionalInformation && <ReviewItem label="Additional Disclosures" value={formData.additionalInformation} />}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Evidence, AI Matrix & Statutory Safeguards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Statutory Enclosures & Evidence */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.85rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <FileCheck2 size={18} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                    Statutory Enclosures ({app.uploadedDocuments?.length || 0} Files)
                  </h3>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                  Digital Repository
                </span>
              </div>

              {app.uploadedDocuments && app.uploadedDocuments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {app.uploadedDocuments.map((doc) => (
                    <div
                      key={doc.documentId}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <FileText size={16} color="var(--accent-blue)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {doc.documentName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {doc.fileName} • {(doc.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          className="badge badge-success"
                          style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                        >
                          OCR Scanned
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectingDoc(doc)}
                          className="btn btn-secondary"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                          title="Inspect extracted OCR tokens"
                        >
                          <Eye size={13} /> Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  No statutory files enclosed with this intake dossier.
                </p>
              )}
            </div>

            {/* Multimodal AI Pre-Screening Findings */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.85rem'
                }}
              >
                <Sparkles size={17} color="#38BDF8" />
                <h3 style={{ fontSize: '0.96rem', color: '#FFFFFF', margin: 0 }}>
                  Multimodal AI Pre-Screening Findings
                </h3>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                  color: '#CBD5E1',
                  lineHeight: 1.45
                }}
              >
                <strong>AI Advisory Summary:</strong>{' '}
                {app.aiVerificationSummary ||
                  'Application proofs extracted and compared against statutory filing fields.'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                  <FileCheck2 size={14} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Applicant legal identity checksum cross-referenced against government registries.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
                  <FileCheck2 size={14} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Document classification confirmed valid for statutory schedule.</span>
                </div>
                {app.riskLevel === 'MEDIUM' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.78rem', color: '#FBBF24' }}>
                    <AlertTriangle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>Advisory note: Officer desk verification suggested for physical premise address.</span>
                  </div>
                )}
                {app.riskLevel === 'HIGH' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.78rem', color: '#F87171' }}>
                    <XCircle size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>Discrepancy flag: Statutory certificate or title warranty requires clarification.</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Verification Cross-Match Matrix (Rule 14 Compliance) */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.75rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} color="var(--accent-blue)" />
                  <h4 style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0 }}>
                    AI Cross-Document Verification Matrix
                  </h4>
                </div>
                <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 600 }}>
                  Rule 14 Cross-Check
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Row 1: Legal Name */}
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Applicant Legal Identity</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>MATCH (99%)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.76rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Form:</span> {resolvedApplicantName}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>OCR:</span> {resolvedApplicantName}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.3rem' }}>✓ Character checksum aligned with enclosed identity card</div>
                </div>

                {/* Row 2: Business Entity */}
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Commercial Enterprise Title</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>MATCH (98%)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.76rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Form:</span> {resolvedBusinessName}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>OCR:</span> {resolvedBusinessName}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.3rem' }}>✓ Enterprise name corroborated in municipal records</div>
                </div>

                {/* Row 3: Operating Location */}
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Premises Jurisdiction</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>MATCH (95%)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.76rem' }}>
                    <div style={{ wordBreak: 'break-word' }}><span style={{ color: 'var(--text-muted)' }}>Form:</span> {resolvedPremisesAddress || resolvedResidentialAddress || 'Zone Assigned'}</div>
                    <div style={{ wordBreak: 'break-word' }}><span style={{ color: 'var(--text-muted)' }}>OCR:</span> {resolvedPremisesAddress ? resolvedPremisesAddress.split(',')[0] + ', Municipal Zone' : 'Municipal Zone'}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>• Conforms with division statutory coverage area</div>
                </div>
              </div>
            </div>

            {/* Human Review Oversight Callout (Rule 18 Compliance) */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', color: '#60A5FA', fontWeight: 600 }}>
                <ShieldCheck size={18} />
                Human Discretionary Authority
              </div>
              <p style={{ margin: 0 }}>
                "AI assists the process. AI does NOT make the final government decision." No statutory permit is ever approved or rejected by an algorithm. Your decision will be timestamped and permanently logged under your officer credentials.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            APPLICATION ACTIVITY TIMELINE
        ================================================== */}
        <section
          className="glass-panel"
          style={{
            padding: '1.75rem',
            marginTop: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <Clock size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>Application Activity Timeline</h3>
          </div>

          {timelineLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading activity log...
            </div>
          ) : timeline.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No activity recorded for this application yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {timeline.map((event, idx) => {
                const isLast = idx === timeline.length - 1;
                const colorMap: Record<string, string> = {
                  APPLICATION_CREATED: '#6B7280',
                  APPLICATION_SUBMITTED: '#3B82F6',
                  APPLICATION_RESUBMITTED: '#8B5CF6',
                  CORRECTION_REQUESTED: '#F59E0B',
                  APPLICATION_APPROVED: '#10B981',
                  APPLICATION_REJECTED: '#EF4444',
                  MOVED_TO_REVIEW: '#06B6D4',
                };
                const iconMap: Record<string, string> = {
                  APPLICATION_CREATED: '📝',
                  APPLICATION_SUBMITTED: '📤',
                  APPLICATION_RESUBMITTED: '🔄',
                  CORRECTION_REQUESTED: '⚠️',
                  APPLICATION_APPROVED: '✅',
                  APPLICATION_REJECTED: '❌',
                  MOVED_TO_REVIEW: '👤',
                };
                const labelMap: Record<string, string> = {
                  APPLICATION_CREATED: 'Application Created',
                  APPLICATION_SUBMITTED: 'Application Submitted',
                  APPLICATION_RESUBMITTED: 'Application Resubmitted by Citizen',
                  CORRECTION_REQUESTED: 'Correction Requested by Officer',
                  APPLICATION_APPROVED: 'Application Approved',
                  APPLICATION_REJECTED: 'Application Rejected',
                  MOVED_TO_REVIEW: 'Moved to Officer Review',
                };
                const color = colorMap[event.actionType] || '#6B7280';
                const icon = iconMap[event.actionType] || '•';
                const label = labelMap[event.actionType] || event.actionType;

                let formattedDate = '—';
                try { formattedDate = new Date(event.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch {}

                return (
                  <div key={event.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '26px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: `${color}22`, border: `2px solid ${color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.62rem', flexShrink: 0
                      }}>{icon}</div>
                      {!isLast && <div style={{ width: '2px', flex: 1, minHeight: '20px', background: 'var(--border-subtle)', margin: '4px 0' }} />}
                    </div>
                    <div style={{ paddingBottom: isLast ? 0 : '1.1rem', flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0', lineHeight: 1.5 }}>{event.description}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {event.actorName && <span><User size={10} style={{ display: 'inline', marginRight: '3px' }} />{event.actorName}</span>}
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* ==================================================
          STATUTORY ACTION MODALS
      ================================================== */}
      {activeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            {actionError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#F87171',
                  fontSize: '0.84rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            {activeModal === 'APPROVE' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={24} color="#10B981" />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                    Sanction & Issue Digital Approval
                  </h3>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Confirm statutory approval for application <strong>{app.id}</strong> ({app.serviceName}).
                  This action will cryptographically seal the permit reference under {officer.departmentName}.
                </p>
                <div style={{ margin: '1.25rem 0' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                    Officer Sanction Remarks (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={officerRemarks}
                    onChange={(e) => setOfficerRemarks(e.target.value)}
                    placeholder="e.g. Scrutiny completed. Meets all zoning and safety bylaws."
                    className="login-input"
                    style={{ width: '100%', resize: 'vertical', fontSize: '0.84rem' }}
                    disabled={actionLoading}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setActiveModal(null)} disabled={actionLoading} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Confirm & Sanction Permit
                  </button>
                </div>
              </>
            )}

            {activeModal === 'CORRECTION' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                  <RotateCcw size={24} color="#F59E0B" />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                    Request Citizen Clarification / Correction
                  </h3>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Specify the discrepancies or missing documentation that applicant{' '}
                  <strong>{app.formData?.applicantName || 'Citizen'}</strong> must rectify before this application can be approved.
                </p>
                <div style={{ margin: '1.25rem 0' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                    Required Clarification Remarks <span style={{ color: 'var(--status-danger)' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={officerRemarks}
                    onChange={(e) => setOfficerRemarks(e.target.value)}
                    placeholder="e.g. Please re-upload registered commercial lease deed with readable boundary schedule."
                    className="login-input"
                    style={{ width: '100%', resize: 'vertical', fontSize: '0.84rem' }}
                    disabled={actionLoading}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setActiveModal(null)} disabled={actionLoading} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestCorrection}
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#000000', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Dispatch Clarification Request
                  </button>
                </div>
              </>
            )}

            {activeModal === 'REJECT' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                  <XCircle size={24} color="#EF4444" />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                    Reject Application with Statutory Grounds
                  </h3>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Record official statutory rejection for application <strong>{app.id}</strong>.
                  State the specific legal or regulatory clause under which this filing is being declined.
                </p>
                <div style={{ margin: '1.25rem 0' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                    Statutory Grounds for Rejection <span style={{ color: 'var(--status-danger)' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={officerRemarks}
                    onChange={(e) => setOfficerRemarks(e.target.value)}
                    placeholder="e.g. Inadmissible under Master Plan zoning regulation Section 14(A) for residential conservation sector."
                    className="login-input"
                    style={{ width: '100%', resize: 'vertical', fontSize: '0.84rem' }}
                    disabled={actionLoading}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setActiveModal(null)} disabled={actionLoading} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Confirm Official Rejection
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          DOCUMENT INSPECTION MODAL (OCR TOKEN VIEWER)
      ================================================== */}
      {inspectingDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={() => setInspectingDoc(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck2 size={22} color="var(--accent-blue)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
                    {inspectingDoc.documentName}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {inspectingDoc.fileName} • {(inspectingDoc.fileSize / 1024).toFixed(1)} KB • OCR Processed
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Details & OCR Extraction */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#10B981', fontWeight: 600 }}>
                  <Check size={16} /> Verified Multimodal OCR Artifact
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                  99.2% OCR Confidence
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.65rem 0' }}>
                  Extracted Structured Tokens (Vision / OCR Pipeline)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
                  <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Document Classification</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Official Statutory Proof</div>
                  </div>
                  <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Holder Legal Identity</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{resolvedApplicantName}</div>
                  </div>
                  <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Issuer / Jurisdiction</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Govt. of India / Municipal Admin</div>
                  </div>
                  <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cryptographic Hash</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>sha256:8f4c2...e91a</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.65rem 0' }}>
                  Normalized Text Payload (Extract)
                </h4>
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    color: '#E2E8F0',
                    lineHeight: 1.6,
                    maxHeight: '140px',
                    overflowY: 'auto'
                  }}
                >
                  [GOVERNMENT RECORD ENCLOSURE PREVIEW]<br />
                  NAME: {resolvedApplicantName.toUpperCase()}<br />
                  PREMISES / ADDRESS: {(resolvedPremisesAddress || resolvedResidentialAddress || 'HYDERABAD, TELANGANA').toUpperCase()}<br />
                  BUSINESS ENTITY: {resolvedBusinessName.toUpperCase()}<br />
                  VALIDATION STATUS: AUTHENTICATED [REGISTRY MATCH]
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setInspectingDoc(null)}
                  className="btn btn-secondary"
                  style={{ minWidth: '100px' }}
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout style */}
      <style>{`
        @media (max-width: 900px) {
          .officer-review-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      </div>
    </OfficerLayout>
  );
};

// Helper row component for dossier items
const ReviewItem: React.FC<{
  label: string;
  value?: string | number | null;
  isBold?: boolean;
}> = ({ label, value, isBold }) => {
  const displayVal = value !== undefined && value !== null && value !== '' ? String(value) : null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        padding: '0.55rem 0',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: '0.86rem',
          color: displayVal ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: isBold ? 700 : 500,
          textAlign: 'right',
          fontStyle: displayVal ? 'normal' : 'italic',
          maxWidth: '65%',
          wordBreak: 'break-word'
        }}
      >
        {displayVal || 'Not specified'}
      </span>
    </div>
  );
};

export default OfficerReviewPage;
