import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ChevronRight,
  Info,
  RotateCcw,
  Activity,
  Layers,
  Loader2
} from 'lucide-react';
import { officerAuth, type OfficerUser } from '../../mock/auth';
import {
  applicationService,
  type ApplicationRecord
} from '../../mock/applicationService';
import { apiClient } from '../../services/apiClient';
import {
  getDepartmentById,
  type GovernmentDepartment
} from '../../config/governmentDepartments';
import OfficerLayout from '../../components/officer/OfficerLayout';

// Inline loading skeleton/number helper
const LoadingValue: React.FC<{
  value: number | string;
  isLoading: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ value, isLoading, className, style }) => {
  if (isLoading) {
    return (
      <span
        style={{
          display: 'inline-block',
          width: '1.4rem',
          height: '1rem',
          borderRadius: '4px',
          backgroundColor: 'var(--bg-secondary)',
          opacity: 0.7,
          verticalAlign: 'middle',
          ...style
        }}
      />
    );
  }
  return <span className={className} style={style}>{value}</span>;
};

export const OfficerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [officer, setOfficer] = useState<OfficerUser | null>(null);
  const [department, setDepartment] = useState<GovernmentDepartment | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    pendingReview: 0,
    correctionRequired: 0,
    approved: 0,
    rejected: 0,
    submitted: 0,
    underReview: 0,
    resubmitted: 0,
    aiProcessing: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Read status filter from URL search params (e.g. ?status=PENDING)
  const initialStatus = (searchParams.get('status') || 'ALL').toUpperCase();
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  const loadLiveOfficerData = async (targetDeptId?: string) => {
    const currentOfficer = officerAuth.getCurrentOfficer();
    const deptId = targetDeptId || currentOfficer?.departmentId;
    if (!deptId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [appsRes, statsRes] = await Promise.all([
        apiClient.get<ApplicationRecord[]>(`/officer/applications?departmentId=${encodeURIComponent(deptId)}`),
        apiClient.get<any>(`/officer/dashboard/stats?departmentId=${encodeURIComponent(deptId)}`)
      ]);

      if (appsRes.ok && Array.isArray(appsRes.data)) {
        setApplications(appsRes.data);
      } else {
        setLoadError(appsRes.error || 'Unable to load live dashboard data.');
        return;
      }

      if (statsRes.ok && statsRes.data) {
        setStats({
          total: statsRes.data.total ?? 0,
          pendingReview: statsRes.data.pendingReview ?? 0,
          correctionRequired: statsRes.data.correctionRequired ?? 0,
          approved: statsRes.data.approved ?? 0,
          rejected: statsRes.data.rejected ?? 0,
          submitted: statsRes.data.submitted ?? 0,
          underReview: statsRes.data.underReview ?? 0,
          resubmitted: statsRes.data.resubmitted ?? 0,
          aiProcessing: statsRes.data.aiProcessing ?? 0
        });
      } else {
        setLoadError(statsRes.error || 'Unable to load live dashboard data.');
        return;
      }
    } catch (err: any) {
      setLoadError(err.message || 'Unable to load live dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentOfficer = officerAuth.getCurrentOfficer();
    if (!currentOfficer) {
      navigate('/officer/login', { replace: true });
      return;
    }

    // Verify session & sync with PostgreSQL me endpoint
    apiClient.get('/auth/me').then((meRes) => {
      if (meRes.ok && meRes.data) {
        const u = meRes.data;
        const syncedOfficer: OfficerUser = {
          officerId: u.id || currentOfficer.officerId,
          officerName: u.fullName || u.name || currentOfficer.officerName,
          email: u.email || currentOfficer.email,
          role: u.officerTitle || currentOfficer.role,
          departmentId: u.departmentId || currentOfficer.departmentId,
          departmentName: u.departmentName || currentOfficer.departmentName,
          departmentCode: u.departmentCode || currentOfficer.departmentCode,
          serviceIds: u.serviceIds || currentOfficer.serviceIds,
          permissions: u.permissions || currentOfficer.permissions
        };
        setOfficer(syncedOfficer);
        const dept = getDepartmentById(syncedOfficer.departmentId);
        if (dept) setDepartment(dept);
        loadLiveOfficerData(syncedOfficer.departmentId);
      } else if (meRes.status === 401) {
        officerAuth.logoutOfficer();
        navigate('/officer/login', { replace: true });
      } else {
        setOfficer(currentOfficer);
        const dept = getDepartmentById(currentOfficer.departmentId);
        if (dept) setDepartment(dept);
        loadLiveOfficerData(currentOfficer.departmentId);
      }
    }).catch(() => {
      setOfficer(currentOfficer);
      const dept = getDepartmentById(currentOfficer.departmentId);
      if (dept) setDepartment(dept);
      loadLiveOfficerData(currentOfficer.departmentId);
    });

    const handleLiveUpdate = () => {
      const activeOfficer = officerAuth.getCurrentOfficer();
      if (activeOfficer) {
        loadLiveOfficerData(activeOfficer.departmentId);
      }
    };
    window.addEventListener('govease_applications_updated', handleLiveUpdate);
    return () => window.removeEventListener('govease_applications_updated', handleLiveUpdate);
  }, [navigate]);

  // Sync state when URL query params change
  useEffect(() => {
    const qStatus = (searchParams.get('status') || 'ALL').toUpperCase();
    setStatusFilter(qStatus);
  }, [searchParams]);

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    if (newStatus === 'ALL') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: newStatus });
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!officer || !department) {
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
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <Loader2 size={28} className="animate-spin" color="var(--accent-blue)" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Loading Officer Portal Workspace...
          </p>
        </div>
      </div>
    );
  }

  // Status breakdown directly from live PostgreSQL stats
  const breakdownSubmitted = stats.submitted ?? 0;
  const breakdownUnderReview = stats.underReview ?? 0;
  const breakdownCorrection = stats.correctionRequired ?? 0;
  const breakdownApproved = stats.approved ?? 0;
  const breakdownRejected = stats.rejected ?? 0;

  const totalCount = stats.total ?? 0;
  const pendingAttentionCount = (stats.pendingReview ?? 0) + (stats.correctionRequired ?? 0);
  const pctSubmitted = totalCount > 0 ? Math.round((breakdownSubmitted / totalCount) * 100) : 0;
  const pctUnderReview = totalCount > 0 ? Math.round((breakdownUnderReview / totalCount) * 100) : 0;
  const pctCorrection = totalCount > 0 ? Math.round((breakdownCorrection / totalCount) * 100) : 0;
  const pctApproved = totalCount > 0 ? Math.round((breakdownApproved / totalCount) * 100) : 0;
  const pctRejected = totalCount > 0 ? Math.round((breakdownRejected / totalCount) * 100) : 0;

  // Filter applications list
  const filteredApps = applications.filter((app) => {
    if (statusFilter === 'PENDING') {
      if (!['SUBMITTED', 'AI_PROCESSING', 'RESUBMITTED'].includes(app.status)) {
        return false;
      }
    } else if (statusFilter === 'UNDER_REVIEW' || statusFilter === 'REVIEW') {
      if (app.status !== 'OFFICER_REVIEW') return false;
    } else if (statusFilter === 'CORRECTION' || statusFilter === 'CORRECTION_REQUIRED') {
      if (!['CORRECTION_REQUIRED', 'CORRECTION_REQUESTED'].includes(app.status)) return false;
    } else if (statusFilter === 'APPROVED') {
      if (!['APPROVED', 'DIGITAL_APPROVAL'].includes(app.status)) return false;
    } else if (statusFilter === 'REJECTED') {
      if (app.status !== 'REJECTED') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = app.id.toLowerCase().includes(q);
      const matchApplicant = (app.formData?.applicantName || '').toLowerCase().includes(q);
      const matchBusiness = (
        app.formData?.businessName ||
        app.formData?.factoryName ||
        app.formData?.industryName ||
        app.formData?.plotNumber ||
        ''
      ).toLowerCase().includes(q);
      const matchService = (app.serviceName || '').toLowerCase().includes(q);
      return matchId || matchApplicant || matchBusiness || matchService;
    }

    return true;
  });

  return (
    <OfficerLayout headerTitle="Dashboard">
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '1.25rem 1.5rem' }}>
        {/* ==================================================
            1. COMPACT PROFESSIONAL HERO SECTION
        ================================================== */}
        <section
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ flex: '1 1 520px', minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span
                className="badge badge-info"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '0.2rem 0.55rem'
                }}
              >
                OFFICER PORTAL
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--accent-blue)',
                  background: 'var(--bg-accent-subtle)',
                  border: '1px solid var(--border-accent)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}
              >
                DIV-CODE: {officer.departmentCode || department.departmentCode}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Officer Desk: <strong>{officer.officerName}</strong> ({officer.role})
              </span>
            </div>

            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 0.35rem 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.25
              }}
            >
              {officer.departmentName || department.departmentName}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                <strong>Statutory Service:</strong>{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{department.serviceName}</span>
              </span>
              <span style={{ color: 'var(--border-subtle)' }}>•</span>
              <span style={{ color: 'var(--text-muted)' }}>
                <strong>Governing Act:</strong> {department.statutoryAct}
              </span>
            </div>
          </div>

          {/* Pending Attention Callout Card */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'right',
              minWidth: '180px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-end'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Pending Attention
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: (pendingAttentionCount > 0) ? 'var(--status-warning)' : 'var(--accent-blue)', lineHeight: 1.1 }}>
              <LoadingValue value={pendingAttentionCount} isLoading={isLoading} />
            </div>
            <div style={{ fontSize: '0.7rem', color: (pendingAttentionCount > 0) ? 'var(--status-warning)' : 'var(--status-success)', marginTop: '0.25rem', fontWeight: 600 }}>
              {pendingAttentionCount > 0 ? 'Action Required Under SLA' : 'All Filings Processed'}
            </div>
          </div>
        </section>

        {/* ==================================================
            ERROR BANNER WITH RETRY
        ================================================== */}
        {loadError && !isLoading && (
          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} color="var(--status-danger)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Unable to load live dashboard data.
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {loadError}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadLiveOfficerData(officer.departmentId)}
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={14} /> Retry
            </button>
          </div>
        )}

        {(!loadError || isLoading) ? (
          <>
            {/* ==================================================
                2. APPLICATION CARDS (5 UNIFORM METRIC CARDS)
            ================================================== */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          {/* Card 1: Total Applications */}
          <div
            className="glass-panel"
            onClick={() => handleFilterChange('ALL')}
            style={{
              padding: '1rem 1.2rem',
              background: 'var(--bg-card)',
              border: statusFilter === 'ALL' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Total Applications
              </span>
              <FileText size={17} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <LoadingValue value={stats.total} isLoading={isLoading} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              All filings assigned to your department
            </div>
          </div>

          {/* Card 2: Pending Review */}
          <div
            className="glass-panel"
            onClick={() => handleFilterChange('PENDING')}
            style={{
              padding: '1rem 1.2rem',
              background: 'var(--bg-card)',
              border: statusFilter === 'PENDING' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#38BDF8' }}>
                Pending Review
              </span>
              <Clock size={17} color="#38BDF8" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38BDF8' }}>
              <LoadingValue value={stats.pendingReview} isLoading={isLoading} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Applications awaiting officer review
            </div>
          </div>

          {/* Card 3: Correction Required */}
          <div
            className="glass-panel"
            onClick={() => handleFilterChange('CORRECTION')}
            style={{
              padding: '1rem 1.2rem',
              background: 'var(--bg-card)',
              border: statusFilter === 'CORRECTION' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--status-warning)' }}>
                Correction Required
              </span>
              <AlertTriangle size={17} color="var(--status-warning)" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--status-warning)' }}>
              <LoadingValue value={stats.correctionRequired} isLoading={isLoading} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Applications returned to applicants
            </div>
          </div>

          {/* Card 4: Approved */}
          <div
            className="glass-panel"
            onClick={() => handleFilterChange('APPROVED')}
            style={{
              padding: '1rem 1.2rem',
              background: 'var(--bg-card)',
              border: statusFilter === 'APPROVED' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--status-success)' }}>
                Approved
              </span>
              <CheckCircle2 size={17} color="var(--status-success)" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--status-success)' }}>
              <LoadingValue value={stats.approved} isLoading={isLoading} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Approved applications
            </div>
          </div>

          {/* Card 5: Rejected */}
          <div
            className="glass-panel"
            onClick={() => handleFilterChange('REJECTED')}
            style={{
              padding: '1rem 1.2rem',
              background: 'var(--bg-card)',
              border: statusFilter === 'REJECTED' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--status-danger)' }}>
                Rejected
              </span>
              <XCircle size={17} color="var(--status-danger)" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--status-danger)' }}>
              <LoadingValue value={stats.rejected} isLoading={isLoading} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Rejected applications
            </div>
          </div>
        </section>

        {/* ==================================================
            3. APPLICATION OVERVIEW (PIPELINE)
        ================================================== */}
        <section
          className="glass-panel"
          style={{
            padding: '1.15rem 1.35rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} color="var(--accent-blue)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Application Overview
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                — Department Application Pipeline ({isLoading ? '' : stats.total} Total)
              </span>
            </div>
          </div>

          {/* Horizontal Distribution Bar */}
          <div
            style={{
              height: '8px',
              width: '100%',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '9999px',
              overflow: 'hidden',
              display: 'flex',
              marginBottom: '0.85rem',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {totalCount > 0 ? (
              <>
                {breakdownSubmitted > 0 && (
                  <div title={`Submitted: ${breakdownSubmitted} (${pctSubmitted}%)`} style={{ width: `${pctSubmitted}%`, backgroundColor: '#38BDF8', transition: 'width 0.3s ease' }} />
                )}
                {breakdownUnderReview > 0 && (
                  <div title={`Under Review: ${breakdownUnderReview} (${pctUnderReview}%)`} style={{ width: `${pctUnderReview}%`, backgroundColor: '#6366F1', transition: 'width 0.3s ease' }} />
                )}
                {breakdownCorrection > 0 && (
                  <div title={`Correction Required: ${breakdownCorrection} (${pctCorrection}%)`} style={{ width: `${pctCorrection}%`, backgroundColor: '#F59E0B', transition: 'width 0.3s ease' }} />
                )}
                {breakdownApproved > 0 && (
                  <div title={`Approved: ${breakdownApproved} (${pctApproved}%)`} style={{ width: `${pctApproved}%`, backgroundColor: '#10B981', transition: 'width 0.3s ease' }} />
                )}
                {breakdownRejected > 0 && (
                  <div title={`Rejected: ${breakdownRejected} (${pctRejected}%)`} style={{ width: `${pctRejected}%`, backgroundColor: '#EF4444', transition: 'width 0.3s ease' }} />
                )}
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: 'rgba(148, 163, 184, 0.1)' }} />
            )}
          </div>

          {totalCount === 0 && !isLoading ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
              No applications in this department yet.
            </div>
          ) : null}

          {/* Legend and Clickable Status Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.65rem'
            }}
          >
            <button
              type="button"
              onClick={() => handleFilterChange('PENDING')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                color: statusFilter === 'PENDING' ? 'var(--accent-blue-light)' : 'var(--text-secondary)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
              <span>Submitted (<LoadingValue value={breakdownSubmitted} isLoading={isLoading} />)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('UNDER_REVIEW')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                color: statusFilter === 'UNDER_REVIEW' ? 'var(--accent-blue-light)' : 'var(--text-secondary)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366F1' }} />
              <span>Under Review (<LoadingValue value={breakdownUnderReview} isLoading={isLoading} />)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('CORRECTION')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                color: statusFilter === 'CORRECTION' ? 'var(--accent-blue-light)' : 'var(--text-secondary)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <span>Correction Required (<LoadingValue value={breakdownCorrection} isLoading={isLoading} />)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('APPROVED')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                color: statusFilter === 'APPROVED' ? 'var(--accent-blue-light)' : 'var(--text-secondary)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span>Approved (<LoadingValue value={breakdownApproved} isLoading={isLoading} />)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('REJECTED')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                color: statusFilter === 'REJECTED' ? 'var(--accent-blue-light)' : 'var(--text-secondary)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              <span>Rejected (<LoadingValue value={breakdownRejected} isLoading={isLoading} />)</span>
            </button>
          </div>
        </section>

        {/* ==================================================
            4. QUICK ACTIONS
        ================================================== */}
        <section
          className="glass-panel"
          style={{
            padding: '0.75rem 1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Activity size={15} color="var(--accent-blue)" />
            <span>Quick Actions:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleFilterChange('PENDING')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.76rem',
                padding: '0.38rem 0.75rem',
                backgroundColor: statusFilter === 'PENDING' ? 'var(--accent-blue-subtle)' : undefined,
                borderColor: statusFilter === 'PENDING' ? 'var(--accent-blue)' : undefined
              }}
            >
              <Clock size={13} /> View Pending Applications (<LoadingValue value={stats.pendingReview} isLoading={isLoading} />)
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('CORRECTION')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.76rem',
                padding: '0.38rem 0.75rem',
                backgroundColor: statusFilter === 'CORRECTION' ? 'var(--accent-blue-subtle)' : undefined,
                borderColor: statusFilter === 'CORRECTION' ? 'var(--accent-blue)' : undefined
              }}
            >
              <AlertTriangle size={13} /> Correction Requests (<LoadingValue value={stats.correctionRequired} isLoading={isLoading} />)
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('APPROVED')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.76rem',
                padding: '0.38rem 0.75rem',
                backgroundColor: statusFilter === 'APPROVED' ? 'var(--accent-blue-subtle)' : undefined,
                borderColor: statusFilter === 'APPROVED' ? 'var(--accent-blue)' : undefined
              }}
            >
              <CheckCircle2 size={13} /> Approved Applications (<LoadingValue value={stats.approved} isLoading={isLoading} />)
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('ALL')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.76rem',
                padding: '0.38rem 0.75rem',
                backgroundColor: statusFilter === 'ALL' ? 'var(--accent-blue-subtle)' : undefined,
                borderColor: statusFilter === 'ALL' ? 'var(--accent-blue)' : undefined
              }}
            >
              <Layers size={13} /> All Applications (<LoadingValue value={stats.total} isLoading={isLoading} />)
            </button>
          </div>
        </section>

        {/* ==================================================
            5. APPLICATIONS REQUIRING ATTENTION TABLE
        ================================================== */}
        <section
          className="glass-panel"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Table Strip Header & Search */}
          <div
            style={{
              padding: '1.1rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 0.15rem 0'
                  }}
                >
                  Applications Requiring Attention
                </h2>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                  Official review desk for statutory {department.serviceName} applications.
                </p>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, applicant, service..."
                  className="login-input"
                  style={{
                    paddingLeft: '2.1rem',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => handleFilterChange('ALL')}
                className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
              >
                All (<LoadingValue value={stats.total} isLoading={isLoading} />)
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('PENDING')}
                className={`btn ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
              >
                Pending (<LoadingValue value={stats.pendingReview} isLoading={isLoading} />)
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('UNDER_REVIEW')}
                className={`btn ${statusFilter === 'UNDER_REVIEW' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
              >
                Under Review (<LoadingValue value={stats.underReview} isLoading={isLoading} />)
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('CORRECTION')}
                className={`btn ${statusFilter === 'CORRECTION' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
              >
                Correction Required (<LoadingValue value={stats.correctionRequired} isLoading={isLoading} />)
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('APPROVED')}
                className={`btn ${statusFilter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
              >
                Approved (<LoadingValue value={stats.approved} isLoading={isLoading} />)
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('REJECTED')}
                className={`btn ${statusFilter === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
              >
                Rejected (<LoadingValue value={stats.rejected} isLoading={isLoading} />)
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="officer-table-container" style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <Loader2 size={24} className="animate-spin" color="var(--accent-blue)" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                  Fetching live applications from database...
                </p>
              </div>
            ) : filteredApps.length === 0 ? (
              /* CLEAN EMPTY STATE */
              <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.85rem'
                  }}
                >
                  <Info size={24} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  No applications yet
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                  There are currently no government service applications assigned to this department.
                </p>
                {(statusFilter !== 'ALL' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setSearchQuery('');
                      searchParams.delete('status');
                      setSearchParams(searchParams);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <RotateCcw size={14} /> View All Applications
                  </button>
                )}
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.84rem'
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}
                  >
                    <th style={{ padding: '0.75rem 1.1rem' }}>Application ID</th>
                    <th style={{ padding: '0.75rem 1.1rem' }}>Applicant</th>
                    <th style={{ padding: '0.75rem 1.1rem' }}>Service</th>
                    <th style={{ padding: '0.75rem 1.1rem' }}>Submitted Date</th>
                    <th style={{ padding: '0.75rem 1.1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => {
                    const applicant = app.formData?.applicantName || 'Citizen Applicant';
                    const entity =
                      app.formData?.businessName ||
                      app.formData?.factoryName ||
                      app.formData?.industryName ||
                      app.formData?.plotNumber ||
                      'Establishment Premise';

                    return (
                      <tr
                        key={app.id}
                        className="officer-table-row"
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* ID */}
                        <td
                          style={{
                            padding: '0.8rem 1.1rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            color: 'var(--accent-blue-light)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Link
                            to={`/officer/applications/${app.id}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {app.id}
                          </Link>
                        </td>

                        {/* Applicant */}
                        <td style={{ padding: '0.8rem 1.1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {applicant}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {entity}
                          </div>
                        </td>

                        {/* Service */}
                        <td style={{ padding: '0.8rem 1.1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {app.serviceName}
                          </span>
                        </td>

                        {/* Date */}
                        <td
                          style={{
                            padding: '0.8rem 1.1rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatDate(app.submittedAt || app.createdAt)}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.8rem 1.1rem', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${applicationService.getStatusBadgeClass(app.status)}`}>
                            {applicationService.getStatusLabel(app.status)}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '0.8rem 1.1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Link
                            to={`/officer/applications/${app.id}`}
                            className="btn btn-primary"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.35rem 0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            Review <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
          </>
        ) : (
          <div
            className="glass-panel"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              marginBottom: '1.5rem'
            }}
          >
            <AlertTriangle size={36} color="var(--status-warning)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>
              Live Department Application Data Offline
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              The officer workspace was unable to connect to the backend service to retrieve department application metrics. Please verify that the backend API is online and retry.
            </p>
            <button
              type="button"
              onClick={() => loadLiveOfficerData(officer.departmentId)}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
            >
              <RotateCcw size={15} /> Retry Connecting
            </button>
          </div>
        )}

        {/* ==================================================
            STATUTORY SAFEGUARD STRIP
        ================================================== */}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.18)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.45
          }}
        >
          <ShieldCheck size={18} color="#38BDF8" style={{ flexShrink: 0 }} />
          <span>
            <strong>Statutory Administrative Safeguard:</strong> Authorized for{' '}
            <strong>{department.departmentName}</strong> handling <strong>{department.serviceName}</strong>. AI pre-screenings and document cross-checks are assistive advisory tools. Discretionary decisions require human verification under delegated administrative powers.
          </span>
        </div>
      </div>

      {/* Embedded CSS for table hover & responsive styling */}
      <style>{`
        .officer-table-row:hover {
          background-color: var(--bg-accent-subtle);
        }
        @media (max-width: 768px) {
          .officer-table-container table {
            min-width: 720px;
          }
        }
      `}</style>
    </OfficerLayout>
  );
};

export default OfficerDashboardPage;
