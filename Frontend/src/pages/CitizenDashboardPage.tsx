import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  applicationService,
  mergeApplicationsIntoStorage,
  type ApplicationRecord
} from '../mock/applicationService';
import { apiClient } from '../services/apiClient';
import { notificationService, type NotificationItem } from '../mock/notifications';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Award,
  PlayCircle,
  Plus
} from 'lucide-react';

export const CitizenDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pendingReview: 0,
    correctionRequired: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser?.id) {
      // Immediate initial state
      setApplications(applicationService.getApplicationsByUser(currentUser.id));
      setStats(applicationService.getApplicationStats(currentUser.id));
      setNotifications(notificationService.getNotifications(currentUser.id));

      const loadLiveCitizenData = async () => {
        try {
          const [appsRes, statsRes, notifsRes] = await Promise.all([
            apiClient.get<ApplicationRecord[]>('/applications'),
            apiClient.get<any>('/applications/stats/summary'),
            apiClient.get<NotificationItem[]>('/notifications')
          ]);

          if (appsRes.ok && Array.isArray(appsRes.data)) {
            setApplications(appsRes.data);
            mergeApplicationsIntoStorage(appsRes.data);
          }
          if (statsRes.ok && statsRes.data) {
            setStats(statsRes.data);
          }
          if (notifsRes.ok && Array.isArray(notifsRes.data)) {
            setNotifications(notifsRes.data);
          }
        } catch (err) {
          console.warn('Citizen dashboard live fetch error:', err);
        }
      };

      loadLiveCitizenData();

      const handleAppsUpdate = () => {
        loadLiveCitizenData();
      };
      window.addEventListener('govease_applications_updated', handleAppsUpdate);
      window.addEventListener('govease_notifications_updated', handleAppsUpdate);

      return () => {
        window.removeEventListener('govease_applications_updated', handleAppsUpdate);
        window.removeEventListener('govease_notifications_updated', handleAppsUpdate);
      };
    }
  }, [currentUser, loading, navigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCitizenDisplayName = () => {
    if (loading) return 'Loading profile...';
    if (!currentUser) return 'Unable to load profile.';
    const raw = (currentUser.fullName || currentUser.name || '').trim();
    if (!raw) return 'Citizen';
    return raw
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Find priority attention items
  const correctionApp = applications.find((a) => a.status === 'CORRECTION_REQUIRED');
  const draftApp = applications.find((a) => a.status === 'DRAFT');
  const approvedApp = applications.find((a) => a.status === 'APPROVED' || a.status === 'DIGITAL_APPROVAL');

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ==================================================
            1. Welcome Section (Open Canvas Header)
        ================================================== */}
        <header className="citizen-canvas-header">
          <div style={{ maxWidth: '640px' }}>
            <div className="citizen-hero-eyebrow">
              <Sparkles size={13} />
              CITIZEN WORKSPACE
            </div>
            <h1
              id="citizen-greeting"
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
                letterSpacing: '-0.03em'
              }}
            >
              {loading ? 'Loading profile...' : currentUser ? `${getGreeting()}, ${getCitizenDisplayName()}` : 'Unable to load profile.'}
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0', lineHeight: 1.5 }}>
              Manage your government applications, services and documents from one place.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
              {stats.correctionRequired > 0 ? (
                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={13} /> Action required: {stats.correctionRequired} application needs correction
                </span>
              ) : (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={13} /> Your applications are up to date.
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {draftApp ? (
              <Link
                to={applicationService.getApplicationResumeRoute(draftApp)}
                className="btn btn-primary hover-lift"
                style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <PlayCircle size={16} /> Continue Application
              </Link>
            ) : null}
            <Link
              to="/services"
              className={draftApp ? "btn btn-secondary hover-lift" : "btn btn-primary hover-lift"}
              style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem' }}
            >
              <Plus size={16} /> New Application
            </Link>
            <Link
              to="/applications"
              className="btn btn-secondary hover-lift"
              style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem' }}
            >
              View My Applications
            </Link>
          </div>
        </header>

        {/* ==================================================
            2. Unified Metrics Ribbon (1 Cohesive Bar - No Separate Box Cards)
        ================================================== */}
        <section style={{ marginBottom: '1.75rem' }}>
          <div className="unified-metrics-ribbon">
            {/* Total Applications */}
            <Link to="/applications" className="metric-ribbon-col">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Total Applications
                </span>
                <div className="metric-icon-indicator" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-blue)' }}>
                  <FileText size={17} />
                </div>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View all applications <ArrowRight size={11} />
              </div>
            </Link>

            {/* Pending Review */}
            <Link to="/applications?status=OFFICER_REVIEW" className="metric-ribbon-col">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Pending Review
                </span>
                <div className="metric-icon-indicator" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                  <Clock size={17} />
                </div>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-blue)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {stats.pendingReview}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Under scrutiny or AI processing <ArrowRight size={11} />
              </div>
            </Link>

            {/* Correction Required */}
            <Link to="/applications?status=CORRECTION_REQUIRED" className="metric-ribbon-col">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Correction Required
                </span>
                <div className="metric-icon-indicator" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)' }}>
                  <AlertTriangle size={17} />
                </div>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--status-warning)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {stats.correctionRequired}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Citizen update required <ArrowRight size={11} />
              </div>
            </Link>

            {/* Approved */}
            <Link to="/applications?status=APPROVED" className="metric-ribbon-col">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Approved
                </span>
                <div className="metric-icon-indicator" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)' }}>
                  <CheckCircle2 size={17} />
                </div>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--status-success)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {stats.approved}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Sanctioned certificates <ArrowRight size={11} />
              </div>
            </Link>
          </div>
        </section>

        {/* ==================================================
            3. Priority Attention: Correction Required Banner (Sleek Inline Ribbon)
        ================================================== */}
        {correctionApp && (
          <div className="citizen-alert-ribbon warning">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(217, 119, 6, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginRight: '0.5rem' }}>
                  Action Required: Your {correctionApp.serviceName} application requires correction
                </span>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                  {correctionApp.id}
                </span>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  — {correctionApp.remarks || 'Please upload a high-resolution copy of the commercial establishment Electricity Bill or Property Tax Receipt matching the business address.'}
                </span>
              </div>
            </div>

            <Link
              to={`/applications/${correctionApp.id}`}
              className="btn btn-primary hover-lift"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                borderColor: 'rgba(217, 119, 6, 0.4)'
              }}
            >
              Fix Application <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ==================================================
            4. Priority Attention: Digital Approval Banner (Sleek Inline Ribbon)
        ================================================== */}
        {approvedApp && (
          <div className="citizen-alert-ribbon success">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0
                }}
              >
                <Award size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginRight: '0.5rem' }}>
                  Application Approved: {approvedApp.serviceName}
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                  {approvedApp.id}
                </span>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  — Sanctioned on {formatDate(approvedApp.updatedAt)}. Ready for download.
                </span>
              </div>
            </div>

            <Link
              to={`/applications/${approvedApp.id}/approval`}
              className="btn btn-primary hover-lift"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: 'rgba(5, 150, 105, 0.4)'
              }}
            >
              View Digital Approval <ExternalLink size={14} />
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CitizenDashboardPage;
