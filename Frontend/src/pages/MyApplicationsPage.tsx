import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  FolderOpen,
  PlayCircle,
  Compass
} from 'lucide-react';

export const MyApplicationsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const user = authUser || authService.getCurrentUser();
    if (user) {
      // Immediate cached load
      setApplications(applicationService.getApplicationsByUser(user.id));

      const loadLiveApps = async () => {
        try {
          const res = await apiClient.get<ApplicationRecord[]>('/applications');
          if (res.ok && Array.isArray(res.data)) {
            setApplications(res.data);
            mergeApplicationsIntoStorage(res.data);
          }
        } catch (err) {
          console.warn('Live applications fetch error:', err);
        }
      };

      loadLiveApps();

      const handleAppsUpdate = () => loadLiveApps();
      window.addEventListener('govease_applications_updated', handleAppsUpdate);
      return () => window.removeEventListener('govease_applications_updated', handleAppsUpdate);
    } else {
      setApplications([]);
    }
  }, [authUser]);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.formData?.applicantName &&
        app.formData.applicantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.formData?.businessName &&
        app.formData.businessName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OFFICER_REVIEW' || statusFilter === 'PENDING') {
      return app.status === 'OFFICER_REVIEW';
    }
    if (statusFilter === 'AI_PROCESSING' || statusFilter === 'AI_VERIFICATION') {
      return app.status === 'AI_PROCESSING';
    }
    if (statusFilter === 'CORRECTION_REQUIRED' || statusFilter === 'CORRECTION') {
      return app.status === 'CORRECTION_REQUIRED';
    }
    if (statusFilter === 'APPROVED') {
      return ['APPROVED', 'DIGITAL_APPROVAL'].includes(app.status);
    }
    if (statusFilter === 'SUBMITTED') {
      return ['SUBMITTED', 'RESUBMITTED'].includes(app.status);
    }
    if (statusFilter === 'DRAFT') {
      return app.status === 'DRAFT';
    }
    if (statusFilter === 'REJECTED') {
      return app.status === 'REJECTED';
    }
    return app.status === statusFilter;
  });

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Navigation Breadcrumb / Back Button */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
              My Applications
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Track all your submitted and draft government service applications.
            </p>
          </div>

          <Link
            to="/services"
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.35rem', fontSize: '0.88rem' }}
          >
            <Plus size={16} /> New Application
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            marginBottom: '1.75rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Service, or Business..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--input-text)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Status Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.35rem',
              flexWrap: 'wrap',
              background: 'var(--bg-secondary)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {[
              { id: 'ALL', label: 'All' },
              { id: 'DRAFT', label: 'Drafts' },
              { id: 'SUBMITTED', label: 'Submitted' },
              { id: 'OFFICER_REVIEW', label: 'Under Review' },
              { id: 'AI_PROCESSING', label: 'AI Verification' },
              { id: 'CORRECTION_REQUIRED', label: 'Correction Required' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: 'none',
                  color: statusFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                  background: statusFilter === tab.id ? 'var(--accent-blue)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List Table */}
        {filteredApplications.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                marginBottom: '1rem'
              }}
            >
              <FolderOpen size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              No applications match your criteria
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Try adjusting your search terms or filters, or start a new government service application.
            </p>
            <div style={{ display: 'inline-flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {statusFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="btn btn-secondary"
                >
                  View All Applications
                </button>
              )}
              <Link to="/services" className="btn btn-primary">
                Browse Government Services <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="glass-panel"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              overflowX: 'auto',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Application ID
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Service Details
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Submission Date
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Last Updated
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease'
                    }}
                    className="dashboard-table-row"
                  >
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <Link
                        to={`/applications/${app.id}`}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          color: 'var(--accent-blue)',
                          textDecoration: 'none'
                        }}
                      >
                        {app.id}
                      </Link>
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                        {app.serviceName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {app.formData?.businessName ? `Business: ${app.formData.businessName}` : app.department || 'State Administration'}
                      </div>
                    </td>
                    <td style={{ padding: '1.1rem 1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {formatDate(app.createdAt)}
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span className={`badge ${applicationService.getStatusBadgeClass(app.status)}`}>
                        {applicationService.getStatusLabel(app.status)}
                      </span>
                      {app.status === 'CORRECTION_REQUIRED' && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--status-warning)', marginTop: '3px' }}>
                          Remarks provided
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1.1rem 1rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      {formatDate(app.updatedAt)}
                    </td>
                    <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {app.status === 'CORRECTION_REQUIRED' ? (
                          <>
                            <Link
                              to={`/applications/${app.id}`}
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.45rem 0.85rem',
                                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                                borderColor: 'rgba(217, 119, 6, 0.4)'
                              }}
                            >
                              Review &amp; Correct
                            </Link>
                            <Link
                              to={`/applications/${app.id}`}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                            >
                              View Application
                            </Link>
                          </>
                        ) : app.status === 'DRAFT' ? (
                          <>
                            <Link
                              to={applicationService.getApplicationResumeRoute(app)}
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.45rem 0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                            >
                              <PlayCircle size={13} /> Continue Application
                            </Link>
                            <Link
                              to={`/applications/${app.id}`}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                            >
                              View Application
                            </Link>
                          </>
                        ) : app.status === 'APPROVED' || app.status === 'DIGITAL_APPROVAL' ? (
                          <>
                            <Link
                              to={`/applications/${app.id}/approval`}
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.45rem 0.85rem',
                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                borderColor: 'rgba(5, 150, 105, 0.4)'
                              }}
                            >
                              View Approval
                            </Link>
                            <Link
                              to={`/applications/${app.id}`}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                            >
                              View Application
                            </Link>
                          </>
                        ) : ['OFFICER_REVIEW', 'AI_PROCESSING', 'SUBMITTED', 'RESUBMITTED'].includes(app.status) ? (
                          <>
                            <Link
                              to={`/applications/${app.id}`}
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.45rem 0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                            >
                              <Compass size={13} /> Track Application
                            </Link>
                            <Link
                              to={`/applications/${app.id}`}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                            >
                              View Application
                            </Link>
                          </>
                        ) : (
                          <Link
                            to={`/applications/${app.id}`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                          >
                            View Application
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyApplicationsPage;
