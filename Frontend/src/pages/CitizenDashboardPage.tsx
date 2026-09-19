import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  applicationService,
  mergeApplicationsIntoStorage,
  type ApplicationRecord
} from '../mock/applicationService';
import { apiClient } from '../services/apiClient';
import { MOCK_SERVICES } from '../mock/services';
import { notificationService, type NotificationItem } from '../mock/notifications';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Bot,
  FolderOpen,
  Search,
  Sparkles,
  Award,
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  HelpCircle,
  RotateCcw,
  PlayCircle,
  Plus
} from 'lucide-react';

export const CitizenDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
    // Format full_name properly with Title Case
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
  const activeApp = applications.find(
    (a) => ['OFFICER_REVIEW', 'AI_PROCESSING', 'SUBMITTED', 'RESUBMITTED'].includes(a.status)
  ) || (draftApp ? draftApp : applications[0]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building':
        return <Building size={20} />;
      case 'Store':
        return <Store size={20} />;
      case 'Briefcase':
        return <Briefcase size={20} />;
      case 'Hammer':
        return <Hammer size={20} />;
      case 'Factory':
        return <Factory size={20} />;
      case 'ShieldCheck':
        return <ShieldCheck size={20} />;
      default:
        return <Building size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Service filtering for Section 10 & 11
  const categories = ['All', 'Business', 'Construction', 'Industry', 'Environment'];
  const filteredServices = useMemo(() => {
    const q = serviceSearch.toLowerCase().trim();
    return MOCK_SERVICES.filter((srv) => {
      const matchesSearch =
        q === '' ||
        srv.name.toLowerCase().includes(q) ||
        srv.category.toLowerCase().includes(q) ||
        srv.description.toLowerCase().includes(q) ||
        srv.shortDescription.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || srv.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [serviceSearch, selectedCategory]);

  const handleNotificationClick = (notif: NotificationItem) => {
    notificationService.markAsRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const suggestedQuestions = [
    'What documents do I need?',
    'How does the application process work?',
    'Can I apply online?',
    'What is my application status?'
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ==================================================
            1. Welcome Section (Section 4)
        ================================================== */}
        <section
          className="glass-panel"
          style={{
            padding: '2rem 2.25rem',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
            border: '1px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div
              className="section-eyebrow"
              style={{
                background: 'rgba(37, 99, 235, 0.12)',
                borderColor: 'var(--border-accent)',
                color: 'var(--accent-blue)',
                marginBottom: '0.65rem'
              }}
            >
              <Sparkles size={13} />
              CITIZEN WORKSPACE
            </div>
            <h1
              id="citizen-greeting"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
                letterSpacing: '-0.02em'
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

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            {draftApp ? (
              <Link
                to={applicationService.getApplicationResumeRoute(draftApp)}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.35rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <PlayCircle size={16} /> Continue Application
              </Link>
            ) : null}
            <Link
              to="/services"
              className={draftApp ? "btn btn-secondary" : "btn btn-primary"}
              style={{ padding: '0.75rem 1.35rem', fontSize: '0.88rem' }}
            >
              <Plus size={16} /> New Application
            </Link>
            <Link
              to="/applications"
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem' }}
            >
              View My Applications
            </Link>
          </div>
        </section>

        {/* ==================================================
            2. Priority Attention: Correction Required Banner (Section 17)
        ================================================== */}
        {correctionApp && (
          <section
            className="glass-panel"
            style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '1.75rem',
              background: 'var(--status-warning-bg)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', maxWidth: '720px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-warning)',
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                    Action Required: Your {correctionApp.serviceName} application requires correction
                  </strong>
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                    {correctionApp.id}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Reason: {correctionApp.remarks || 'Address proof does not match the application premises address.'}
                </p>
              </div>
            </div>

            <Link
              to={`/applications/${correctionApp.id}`}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                borderColor: 'rgba(217, 119, 6, 0.5)'
              }}
            >
              Fix Application <ArrowRight size={15} />
            </Link>
          </section>
        )}

        {/* ==================================================
            3. Priority Attention: Digital Approval Banner (Section 18)
        ================================================== */}
        {approvedApp && (
          <section
            className="glass-panel"
            style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '1.75rem',
              background: 'var(--status-success-bg)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-success)',
                  flexShrink: 0
                }}
              >
                <Award size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                    Application Approved: {approvedApp.serviceName}
                  </strong>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    {approvedApp.id}
                  </span>
                  {approvedApp.approvalReference && (
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      Ref: {approvedApp.approvalReference}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Sanctioned on {formatDate(approvedApp.updatedAt)}. Prototype digital approval certificate is ready.
                </p>
              </div>
            </div>

            <Link
              to={`/applications/${approvedApp.id}/approval`}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: 'rgba(5, 150, 105, 0.5)'
              }}
            >
              View Digital Approval <ExternalLink size={15} />
            </Link>
          </section>
        )}

        {/* ==================================================
            4. Application Statistics (Section 5 - 4 Clickable Cards)
        ================================================== */}
        <section style={{ marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
              Application Overview
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click any card to filter applications
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* Total Applications */}
            <Link
              to="/applications"
              className="glass-panel"
              style={{
                padding: '1.35rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Total Applications
                </span>
                <div style={{ color: 'var(--accent-blue)' }}>
                  <FileText size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View all applications <ArrowRight size={12} />
              </div>
            </Link>

            {/* Pending Review */}
            <Link
              to="/applications?status=OFFICER_REVIEW"
              className="glass-panel"
              style={{
                padding: '1.35rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Pending Review
                </span>
                <div style={{ color: 'var(--accent-cyan)' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-blue)', lineHeight: 1 }}>
                {stats.pendingReview}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Under scrutiny or AI processing <ArrowRight size={12} />
              </div>
            </Link>

            {/* Correction Required */}
            <Link
              to="/applications?status=CORRECTION_REQUIRED"
              className="glass-panel"
              style={{
                padding: '1.35rem',
                background: 'var(--bg-card)',
                border: stats.correctionRequired > 0 ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-subtle)',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Correction Required
                </span>
                <div style={{ color: 'var(--status-warning)' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--status-warning)', lineHeight: 1 }}>
                {stats.correctionRequired}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Citizen update required <ArrowRight size={12} />
              </div>
            </Link>

            {/* Approved */}
            <Link
              to="/applications?status=APPROVED"
              className="glass-panel"
              style={{
                padding: '1.35rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Approved
                </span>
                <div style={{ color: 'var(--status-success)' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--status-success)', lineHeight: 1 }}>
                {stats.approved}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Sanctioned certificates <ArrowRight size={12} />
              </div>
            </Link>
          </div>
        </section>

        {/* ==================================================
            5. Active Application Progress Tracker (Section 8)
        ================================================== */}
        {activeApp && (
          <section
            className="glass-panel"
            style={{
              padding: '1.75rem 2rem',
              marginBottom: '2.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'var(--bg-accent-subtle)',
                    border: '1px solid var(--border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-blue)'
                  }}
                >
                  <Building size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 0.2rem 0' }}>
                    {activeApp.serviceName}
                  </h4>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Token: {activeApp.id} • Submitted on {formatDate(activeApp.createdAt)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge ${applicationService.getStatusBadgeClass(activeApp.status)}`}>
                  {applicationService.getStatusLabel(activeApp.status)}
                </span>
                {activeApp.status === 'DRAFT' ? (
                  <Link
                    to={applicationService.getApplicationResumeRoute(activeApp)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <PlayCircle size={15} /> Continue Application
                  </Link>
                ) : activeApp.status === 'CORRECTION_REQUIRED' ? (
                  <Link
                    to={`/applications/${activeApp.id}`}
                    className="btn btn-primary"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      borderColor: 'rgba(217, 119, 6, 0.4)'
                    }}
                  >
                    Review & Correct
                  </Link>
                ) : (
                  <Link
                    to={`/applications/${activeApp.id}`}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    Track Application
                  </Link>
                )}
              </div>
            </div>

            {/* 6-Stage Progress Tracker */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Current Milestone:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {applicationService.getStatusLabel(activeApp.status)}
                  </strong>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-blue)' }}>
                  Stage {activeApp.status === 'APPROVED' || activeApp.status === 'DIGITAL_APPROVAL' ? 6 : activeApp.status === 'OFFICER_REVIEW' ? 4 : 3} of 6
                </span>
              </div>

              {/* Progress Milestones */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.5rem',
                  marginTop: '1rem'
                }}
              >
                {[
                  { title: 'Submitted', done: true },
                  { title: 'Documents Processed', done: activeApp.status !== 'DRAFT' },
                  { title: 'AI Verification', done: !['DRAFT', 'SUBMITTED'].includes(activeApp.status) },
                  {
                    title: 'Officer Review',
                    done: activeApp.status === 'APPROVED' || activeApp.status === 'DIGITAL_APPROVAL',
                    current: activeApp.status === 'OFFICER_REVIEW'
                  },
                  {
                    title: 'Decision',
                    done: activeApp.status === 'APPROVED' || activeApp.status === 'DIGITAL_APPROVAL',
                    current: activeApp.status === 'CORRECTION_REQUIRED' || activeApp.status === 'REJECTED'
                  },
                  {
                    title: 'Digital Approval',
                    done: activeApp.status === 'APPROVED' || activeApp.status === 'DIGITAL_APPROVAL'
                  }
                ].map((stage, idx) => (
                  <div
                    key={stage.title}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: stage.done
                        ? 'var(--status-success-bg)'
                        : stage.current
                        ? 'var(--bg-accent-subtle)'
                        : 'var(--bg-secondary)',
                      border: stage.done
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : stage.current
                        ? '1px solid var(--border-accent)'
                        : '1px solid var(--border-subtle)',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: stage.done
                            ? 'var(--status-success)'
                            : stage.current
                            ? 'var(--accent-blue)'
                            : 'var(--text-muted)'
                        }}
                      >
                        {stage.done ? '✓' : stage.current ? '●' : '○'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Step {idx + 1}
                      </span>
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: stage.done
                          ? 'var(--status-success)'
                          : stage.current
                          ? 'var(--text-primary)'
                          : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {stage.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            6. Recent Applications (Section 6 & 7)
        ================================================== */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
              Recent Applications
            </h3>
            <Link
              to="/applications"
              style={{
                fontSize: '0.85rem',
                color: 'var(--accent-blue)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none'
              }}
            >
              View all ({applications.length}) <ArrowRight size={14} />
            </Link>
          </div>

          {applications.length === 0 ? (
            /* Empty State (Section 27) */
            <div
              className="glass-panel"
              style={{
                padding: '3rem 2rem',
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
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                No applications yet
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                You haven't started any government service applications.
              </p>
              <Link to="/services" className="btn btn-primary">
                Browse Services <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            /* Table of Applications */
            <div
              className="glass-panel"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                overflowX: 'auto',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '680px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      Application ID
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      Service
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      Submitted Date
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      Status
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      Last Updated
                    </th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 5).map((app) => (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      className="dashboard-table-row"
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                          {app.id}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {app.serviceName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {app.department || 'State Administration'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {formatDate(app.createdAt)}
                      </td>
                      <td style={{ padding: '1rem 1rem' }}>
                        <span className={`badge ${applicationService.getStatusBadgeClass(app.status)}`}>
                          {applicationService.getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {formatDate(app.updatedAt)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {app.status === 'DRAFT' ? (
                          <Link
                            to={applicationService.getApplicationResumeRoute(app)}
                            className="btn btn-primary"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.4rem 0.85rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <PlayCircle size={13} /> Continue Application
                          </Link>
                        ) : app.status === 'CORRECTION_REQUIRED' ? (
                          <Link
                            to={`/applications/${app.id}`}
                            className="btn btn-primary"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.4rem 0.85rem',
                              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                              borderColor: 'rgba(217, 119, 6, 0.4)'
                            }}
                          >
                            Review & Correct
                          </Link>
                        ) : app.status === 'APPROVED' || app.status === 'DIGITAL_APPROVAL' ? (
                          <Link
                            to={`/applications/${app.id}/approval`}
                            className="btn btn-primary"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.4rem 0.85rem',
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              borderColor: 'rgba(5, 150, 105, 0.4)'
                            }}
                          >
                            View Approval
                          </Link>
                        ) : (
                          <Link
                            to={`/applications/${app.id}`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                          >
                            View Application
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ==================================================
            7. Quick Actions (Section 9 - 4 Working Cards)
        ================================================== */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Quick Actions
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* Active Draft Quick Action */}
            {draftApp && (
              <Link
                to={applicationService.getApplicationResumeRoute(draftApp)}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.18s ease'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60A5FA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PlayCircle size={22} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Continue Application
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Resume {draftApp.serviceName} draft ({draftApp.id}) at Step {draftApp.currentStep || 1} of 5.
                </div>
              </Link>
            )}
            {/* Browse Government Services */}
            <Link
              to="/services"
              className="glass-panel"
              style={{
                padding: '1.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.18s ease'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Search size={20} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Browse Government Services
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Discover 6 municipal and industrial state services.
              </div>
            </Link>

            {/* My Applications */}
            <Link
              to="/applications"
              className="glass-panel"
              style={{
                padding: '1.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.18s ease'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={20} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                My Applications
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Filter drafts, pending scrutiny, and approved sanctions.
              </div>
            </Link>

            {/* AI Assistant */}
            <Link
              to="/assistant"
              className="glass-panel"
              style={{
                padding: '1.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.18s ease'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bot size={20} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                AI Assistant
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Get automated guidance on eligibility, rules, and proofs.
              </div>
            </Link>

            {/* Track Application */}
            <Link
              to="/applications"
              className="glass-panel"
              style={{
                padding: '1.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.18s ease'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: 'var(--status-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Clock size={20} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Track Application
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                View desk review timelines, timestamps, and officer remarks.
              </div>
            </Link>
          </div>
        </section>

        {/* ==================================================
            8. Popular Government Services (Section 10 & 11)
        ================================================== */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
                Popular Government Services
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                All 6 centralized municipal and state approval services with automated AI pre-validation
              </p>
            </div>
            <Link
              to="/services"
              style={{
                fontSize: '0.85rem',
                color: 'var(--accent-blue)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none'
              }}
            >
              View Service Catalogue ({MOCK_SERVICES.length}) <ArrowRight size={14} />
            </Link>
          </div>

          {/* Interactive Search & Filter Toolbar */}
          <div
            className="glass-panel"
            style={{
              padding: '0.85rem 1.25rem',
              marginBottom: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder="Search services (e.g. trade, building, pollution)..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.85rem 0.45rem 2rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    border: 'none',
                    fontWeight: selectedCategory === cat ? 600 : 500,
                    color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                    background: selectedCategory === cat ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
              {(serviceSearch || selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setServiceSearch('');
                    setSelectedCategory('All');
                  }}
                  style={{
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.72rem',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Service Cards Grid (All 6 Services) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.18s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'var(--bg-accent-subtle)',
                        border: '1px solid var(--border-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-blue)'
                      }}
                    >
                      {getServiceIcon(srv.iconName)}
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {srv.category}
                    </span>
                  </div>

                  <Link
                    to={`/services/${srv.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      {srv.name}
                    </h4>
                  </Link>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {srv.shortDescription}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Processing Time:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{srv.processingTime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Required Documents:</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                        {srv.requiredDocuments.length} mandatory proofs
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/applications/new/${srv.id}`}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.65rem', fontSize: '0.825rem', justifyContent: 'center' }}
                    >
                      Start Application
                    </Link>
                    <Link
                      to={`/services/${srv.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '0.65rem 0.85rem', fontSize: '0.825rem' }}
                      title="View Requirements & AI Guidance"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================================================
            9. Dual Grid: AI Guidance Card (Sec 12/13) & Notifications + Citizen Profile (Sec 14/19)
        ================================================== */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* AI Guidance Assistant Card (Section 12 & 13) */}
          <div
            className="glass-panel"
            style={{
              padding: '1.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                    border: '1px solid var(--border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-blue)'
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                    Need help with a government service?
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                    GovEaseAI Dedicated Assistant
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Ask GovEaseAI about eligibility criteria, required documents, digital application steps, and real-time status.
              </p>

              {/* Topics Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {['Eligibility', 'Required Documents', 'Application Process', 'Application Status'].map((topic) => (
                  <span
                    key={topic}
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>

              {/* Suggested Questions (Section 13) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Suggested questions:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => navigate(`/assistant?q=${encodeURIComponent(q)}`)}
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                      className="suggested-q-btn"
                    >
                      <span>"{q}"</span>
                      <ArrowRight size={13} style={{ color: 'var(--accent-blue)', opacity: 0.8 }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/assistant"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.85rem' }}
            >
              <Bot size={16} /> Ask AI Assistant
            </Link>
          </div>

          {/* Right Column: Notifications Summary (Sec 14) + Profile Summary (Sec 19) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Notifications Summary Card (Section 14) */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                    Notifications
                  </h4>
                  {unreadCount > 0 ? (
                    <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '0.08rem 0.45rem' }}>
                      {unreadCount} new
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                      All caught up
                    </span>
                  )}
                </div>
                <Link
                  to="/notifications"
                  style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}
                >
                  View all
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: notif.read ? 'var(--bg-secondary)' : 'var(--bg-accent-subtle)',
                      border: notif.read ? '1px solid var(--border-subtle)' : '1px solid var(--border-accent)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {notif.type === 'warning' ? (
                      <AlertTriangle size={15} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    ) : notif.type === 'success' ? (
                      <CheckCircle2 size={15} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <HelpCircle size={15} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: notif.read ? 500 : 600, color: 'var(--text-primary)' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Citizen Profile Summary Widget (Section 19) */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} style={{ color: 'var(--status-success)' }} />
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                    Citizen Profile
                  </h4>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.08rem 0.45rem' }}>
                    Verified
                  </span>
                </div>
                <Link
                  to="/profile"
                  style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}
                >
                  View Profile
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Full Name</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.fullName || currentUser?.name || 'Citizen'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Citizen ID</span>
                  <strong style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{currentUser?.applicantId || 'Pending'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Mail size={11} /> Email
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{currentUser?.email || 'Not provided'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Phone size={11} /> Mobile
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{currentUser?.mobile || currentUser?.phone || 'Not provided'}</span>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>Verified Resident • Citizen Profile</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default CitizenDashboardPage;
