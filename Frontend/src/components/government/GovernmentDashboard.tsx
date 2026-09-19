import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  LogOut,
  Menu,
  X,
  Layers,
  Users,
  BarChart3,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useGovernmentAuth } from '../../context/GovernmentAuthContext';
import {
  applicationService,
  type ApplicationRecord,
} from '../../mock/applicationService';
import ThemeToggle from '../ThemeToggle';

// ── Types ─────────────────────────────────────────────────────────────────

interface GovernmentDashboardProps {
  /** Page title shown in header */
  title: string;
  /** Service IDs visible to this role. Empty = show all (Super Admin). */
  serviceIds: string[];
}

type StatusFilter =
  | 'ALL'
  | 'SUBMITTED'
  | 'OFFICER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

// ── Status Helpers ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  AI_PROCESSING: 'AI Processing',
  OFFICER_REVIEW: 'Under Review',
  CORRECTION_REQUIRED: 'Correction Required',
  RESUBMITTED: 'Resubmitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DIGITAL_APPROVAL: 'Digital Approval',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:               { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  SUBMITTED:           { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  AI_PROCESSING:       { bg: 'rgba(168,85,247,0.15)',  color: '#c084fc' },
  OFFICER_REVIEW:      { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
  CORRECTION_REQUIRED: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  RESUBMITTED:         { bg: 'rgba(14,165,233,0.15)',  color: '#38bdf8' },
  APPROVED:            { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  REJECTED:            { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  DIGITAL_APPROVAL:    { bg: 'rgba(34,197,94,0.2)',    color: '#22c55e' },
};

const AI_COLORS: Record<string, { bg: string; color: string }> = {
  VERIFIED: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  REVIEW:   { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  MISMATCH: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
};

function getAILabel(summary?: string): string {
  if (!summary) return '—';
  const s = summary.toLowerCase();
  if (s.includes('verified') || s.includes('match')) return 'Verified';
  if (s.includes('review') || s.includes('variance') || s.includes('minor')) return 'Review';
  if (s.includes('mismatch') || s.includes('failed')) return 'Mismatch';
  return 'Pending';
}

function getAIColorKey(summary?: string): string {
  const l = getAILabel(summary);
  if (l === 'Verified') return 'VERIFIED';
  if (l === 'Review') return 'REVIEW';
  if (l === 'Mismatch') return 'MISMATCH';
  return 'REVIEW';
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

// ── Main Component ────────────────────────────────────────────────────────

export const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({
  title,
  serviceIds,
}) => {
  const navigate = useNavigate();
  const { officer, logout } = useGovernmentAuth();

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadApplications = () => {
    const apps = applicationService.getApplicationsByServiceIds(serviceIds);
    setApplications(apps);
  };

  useEffect(() => {
    if (!officer) {
      navigate('/government/login', { replace: true });
      return;
    }
    loadApplications();

    const handleUpdate = () => loadApplications();
    window.addEventListener('govease_applications_updated', handleUpdate);
    return () => window.removeEventListener('govease_applications_updated', handleUpdate);
  }, [officer, serviceIds.join(',')]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadApplications();
    setTimeout(() => setRefreshing(false), 600);
  };

  // ── Stats ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) =>
      ['SUBMITTED', 'AI_PROCESSING', 'OFFICER_REVIEW', 'RESUBMITTED'].includes(a.status)
    ).length;
    const correction = applications.filter((a) => a.status === 'CORRECTION_REQUIRED').length;
    const approved = applications.filter((a) =>
      ['APPROVED', 'DIGITAL_APPROVAL'].includes(a.status)
    ).length;
    const rejected = applications.filter((a) => a.status === 'REJECTED').length;
    return { total, pending, correction, approved, rejected };
  }, [applications]);

  // ── Filtered Applications ─────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = [...applications];

    if (statusFilter !== 'ALL') {
      result = result.filter((a) => {
        if (statusFilter === 'SUBMITTED') return ['SUBMITTED', 'AI_PROCESSING', 'RESUBMITTED'].includes(a.status);
        if (statusFilter === 'OFFICER_REVIEW') return a.status === 'OFFICER_REVIEW';
        if (statusFilter === 'CORRECTION_REQUIRED') return a.status === 'CORRECTION_REQUIRED';
        if (statusFilter === 'APPROVED') return ['APPROVED', 'DIGITAL_APPROVAL'].includes(a.status);
        if (statusFilter === 'REJECTED') return a.status === 'REJECTED';
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.serviceName.toLowerCase().includes(q) ||
          (a.formData?.applicantName || '').toLowerCase().includes(q) ||
          (a.formData?.businessName || '').toLowerCase().includes(q)
      );
    }

    // Sort: newest first
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [applications, statusFilter, searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/government/login', { replace: true });
  };

  if (!officer) return null;

  // ── Sidebar Nav ───────────────────────────────────────────────────────

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            GovEaseAI
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>
            Officer Portal
          </div>
        </div>
      </div>

      {/* Officer Profile */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Signed In As
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
          {officer.fullName}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            background: 'rgba(37, 99, 235, 0.15)',
            color: 'var(--accent-blue)',
            fontSize: '0.7rem',
            fontWeight: 700,
            marginBottom: '0.25rem',
          }}
        >
          <ShieldCheck size={11} />
          {officer.roleDisplayName}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.4 }}>
          {officer.department}
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {[
          { icon: <Layers size={17} />, label: 'Dashboard', to: officer.dashboardRoute },
          { icon: <FileText size={17} />, label: 'All Applications', to: officer.dashboardRoute },
          { icon: <Clock size={17} />, label: 'Pending Review', to: `${officer.dashboardRoute}?status=OFFICER_REVIEW` },
          { icon: <AlertTriangle size={17} />, label: 'Corrections', to: `${officer.dashboardRoute}?status=CORRECTION_REQUIRED` },
          { icon: <CheckCircle2 size={17} />, label: 'Approved', to: `${officer.dashboardRoute}?status=APPROVED` },
          { icon: <XCircle size={17} />, label: 'Rejected', to: `${officer.dashboardRoute}?status=REJECTED` },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.84rem',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {/* Super Admin extras */}
        {officer.role === 'SUPER_ADMIN' && (
          <>
            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.5rem 0' }} />
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0.25rem 0.85rem' }}>
              Admin
            </div>
            {[
              { icon: <Users size={17} />, label: 'All Departments', to: officer.dashboardRoute },
              { icon: <BarChart3 size={17} />, label: 'Analytics', to: officer.dashboardRoute },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#f87171',
            fontSize: '0.84rem',
            fontWeight: 600,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar (desktop) */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
        className="officer-sidebar-desktop"
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '-3rem',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-glass)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '0.25rem',
              }}
              className="officer-sidebar-hamburger"
            >
              <Menu size={22} />
            </button>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleRefresh}
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Refresh applications"
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '1.5rem', overflowX: 'hidden' }}>
          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {[
              {
                label: 'Total Applications',
                value: stats.total,
                icon: <FileText size={20} />,
                color: 'var(--accent-blue)',
                bg: 'rgba(37,99,235,0.12)',
              },
              {
                label: 'Pending Review',
                value: stats.pending,
                icon: <Clock size={20} />,
                color: '#fbbf24',
                bg: 'rgba(245,158,11,0.12)',
              },
              {
                label: 'Correction Required',
                value: stats.correction,
                icon: <AlertTriangle size={20} />,
                color: '#f87171',
                bg: 'rgba(239,68,68,0.12)',
              },
              {
                label: 'Approved',
                value: stats.approved,
                icon: <CheckCircle2 size={20} />,
                color: '#4ade80',
                bg: 'rgba(34,197,94,0.12)',
              },
              {
                label: 'Rejected',
                value: stats.rejected,
                icon: <XCircle size={20} />,
                color: '#94a3b8',
                bg: 'rgba(100,116,139,0.12)',
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: s.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: s.color,
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="govt-dashboard-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, applicant, service..."
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.87rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(
                [
                  { key: 'ALL', label: 'All' },
                  { key: 'SUBMITTED', label: 'Submitted' },
                  { key: 'OFFICER_REVIEW', label: 'Under Review' },
                  { key: 'CORRECTION_REQUIRED', label: 'Correction' },
                  { key: 'APPROVED', label: 'Approved' },
                  { key: 'REJECTED', label: 'Rejected' },
                ] as { key: StatusFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '999px',
                    border: `1px solid ${statusFilter === f.key ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    background: statusFilter === f.key ? 'rgba(37,99,235,0.15)' : 'var(--bg-secondary)',
                    color: statusFilter === f.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: statusFilter === f.key ? 700 : 500,
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table / Cards */}
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <FileText size={48} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Applications Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try clearing your search or filter.'
                  : 'No applications have been submitted for this department yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Result count */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> of {applications.length} applications
              </div>

              {/* Table wrapper — scrollable on mobile */}
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                      {['Application ID', 'Applicant', 'Service', 'Submitted', 'AI Verification', 'Status', 'Action'].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((app, idx) => {
                      const aiLabel = getAILabel(app.aiVerificationSummary);
                      const aiColorKey = getAIColorKey(app.aiVerificationSummary);
                      const aiColor = AI_COLORS[aiColorKey] || AI_COLORS.REVIEW;
                      const statusColor = STATUS_COLORS[app.status] || STATUS_COLORS.SUBMITTED;
                      const applicantName =
                        app.formData?.applicantName ||
                        app.formData?.ownerName ||
                        app.formData?.proprietorName ||
                        '—';

                      return (
                        <tr
                          key={app.id}
                          style={{
                            borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--bg-hover, rgba(255,255,255,0.03))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.78rem',
                                color: 'var(--accent-blue)',
                                fontWeight: 600,
                              }}
                            >
                              {app.id}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {applicantName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                              {app.formData?.businessName || ''}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                              {app.serviceName}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {formatDate(app.submittedAt || app.createdAt)}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.22rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: aiColor.bg,
                                color: aiColor.color,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {aiLabel}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.22rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: statusColor.bg,
                                color: statusColor.color,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {STATUS_LABELS[app.status] || app.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <Link
                              to={`/officer/applications/${app.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.4rem 0.85rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(37,99,235,0.12)',
                                color: 'var(--accent-blue)',
                                textDecoration: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                border: '1px solid rgba(37,99,235,0.2)',
                                whiteSpace: 'nowrap',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = 'rgba(37,99,235,0.2)')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = 'rgba(37,99,235,0.12)')
                              }
                            >
                              <Eye size={13} /> Review
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .officer-sidebar-desktop {
            display: none !important;
          }
          .officer-sidebar-hamburger {
            display: flex !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GovernmentDashboard;
