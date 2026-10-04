import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  LogOut,
  Building2,
  X,
  Award
} from 'lucide-react';
import OfficerSidebar from './OfficerSidebar';
import ThemeToggle from '../ThemeToggle';
import { officerAuth, type OfficerUser } from '../../mock/auth';
import { getDepartmentById } from '../../config/governmentDepartments';
import { apiClient } from '../../services/apiClient';

export interface OfficerActivityItem {
  id: string;
  departmentId: string;
  applicationId: string;
  applicantName?: string | null;
  serviceName?: string | null;
  actionType: string;
  description: string;
  timestamp: string;
  officerName?: string;
}

interface OfficerLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
}

export const OfficerLayout: React.FC<OfficerLayoutProps> = ({
  children,
  headerTitle = 'Dashboard'
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [liveActivities, setLiveActivities] = useState<OfficerActivityItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOfficer: OfficerUser | null = officerAuth.getCurrentOfficer();
  const dept = currentOfficer ? getDepartmentById(currentOfficer.departmentId) : undefined;

  const handleLogout = () => {
    officerAuth.logoutOfficer();
    navigate('/officer/login', { replace: true });
  };

  // Load live activities from PostgreSQL backend
  useEffect(() => {
    if (!currentOfficer) return;

    const fetchActivities = async () => {
      try {
        const res = await apiClient.get<OfficerActivityItem[]>('/officer/activities');
        if (res.ok && Array.isArray(res.data)) {
          setLiveActivities(res.data.slice(0, 5));
        } else {
          setLiveActivities([]);
        }
      } catch {
        setLiveActivities([]);
      }
    };

    fetchActivities();
    window.addEventListener('govease_activities_updated', fetchActivities);
    window.addEventListener('govease_applications_updated', fetchActivities);
    return () => {
      window.removeEventListener('govease_activities_updated', fetchActivities);
      window.removeEventListener('govease_applications_updated', fetchActivities);
    };
  }, [currentOfficer?.departmentId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (ts: string) => {
    try {
      const diffMs = Date.now() - new Date(ts).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `${Math.max(1, mins)}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return 'Recently'; }
  };

  // Map actionType to notification type
  const getActivityType = (actionType: string): 'success' | 'warning' | 'info' => {
    if (actionType === 'APPLICATION_APPROVED') return 'success';
    if (actionType === 'APPLICATION_REJECTED') return 'warning';
    if (actionType === 'CORRECTION_REQUESTED') return 'warning';
    if (actionType === 'APPLICATION_RESUBMITTED') return 'info';
    return 'info';
  };


  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex' }}>
      {/* Officer Left Sidebar */}
      <OfficerSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenNotifications={() => setNotifDropdownOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main Content Wrapper */}
      <div
        className="dashboard-main-wrapper"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: '260px',
          transition: 'margin-left 0.25s ease'
        }}
      >
        {/* Top Officer Administrative Header */}
        <header
          className="dashboard-top-header"
          style={{
            height: '64px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Left: Mobile Toggle & Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="dashboard-mobile-menu-btn"
              style={{
                display: 'none',
                padding: '0.45rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
              aria-label="Open mobile navigation"
            >
              <Menu size={20} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  {headerTitle}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--accent-blue)',
                    background: 'var(--bg-accent-subtle)',
                    border: '1px solid var(--border-accent)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontWeight: 600
                  }}
                >
                  {currentOfficer?.departmentCode || 'OFFICER'}
                </span>
              </div>
              <div className="desktop-header-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Government Officer Review Workspace
              </div>
            </div>
          </div>

          {/* Right: Notifications, Department Name, Officer Name, Avatar, Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Notification Icon & Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                aria-label="Officer Notifications"
              >
                <Bell size={18} />
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-blue)',
                    boxShadow: '0 0 6px var(--accent-blue)'
                  }}
                />
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '340px',
                    maxWidth: '90vw',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-accent)',
                    backgroundColor: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-dropdown)',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      Statutory Notifications
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                      {liveActivities.length > 0 ? `${liveActivities.length} updates` : 'No updates'}
                    </span>
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {liveActivities.length === 0 ? (
                      <div style={{ padding: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        No recent activity in your department queue.
                      </div>
                    ) : liveActivities.map((act) => {
                      const type = getActivityType(act.actionType);
                      return (
                        <div
                          key={act.id}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem'
                          }}
                        >
                          {type === 'warning' ? (
                            <AlertTriangle size={15} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          ) : type === 'success' ? (
                            <CheckCircle2 size={15} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          ) : (
                            <Info size={15} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          )}
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {act.applicantName} — {act.serviceName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {act.description}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                              {formatTimeAgo(act.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ padding: '0.65rem 1rem', textAlign: 'center', background: 'var(--bg-secondary)' }}>
                    <button
                      type="button"
                      onClick={() => setNotifDropdownOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-blue)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Department Name Badge */}
            <div
              className="desktop-header-subtitle"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-pill)',
                maxWidth: '280px'
              }}
              title={currentOfficer?.departmentName}
            >
              <Building2 size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {currentOfficer?.departmentName || 'Department'}
              </span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Officer Name & Profile Avatar */}
            <div
              onClick={() => setProfileModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'border-color 0.18s ease'
              }}
              className="header-profile-pill"
              title="Click to view officer credentials"
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  flexShrink: 0
                }}
              >
                {currentOfficer?.officerName?.charAt(0) || 'O'}
              </div>
              <div className="header-profile-text" style={{ lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  {currentOfficer?.officerName || 'Officer'}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                  {currentOfficer?.officerId || 'OFF-ID'}
                </span>
              </div>
            </div>

            {/* Direct Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="header-logout-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--status-danger, #EF4444)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Terminate statutory officer session"
            >
              <LogOut size={15} />
              <span className="desktop-header-subtitle">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Officer Page Content */}
        <main className="dashboard-main-content">
          {children}
        </main>
      </div>

      {/* Officer Statutory Profile Modal */}
      {profileModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1rem'
          }}
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '2rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-modal)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <Award size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    Officer Credential Dossier
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    GovEaseAI Statutory Verification Service
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Officer Name</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentOfficer?.officerName}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Government ID</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{currentOfficer?.officerId}</div>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department Code</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{currentOfficer?.departmentCode}</div>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Department</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentOfficer?.departmentName}</div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statutory Authority / Act</div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{dept?.statutoryAct || 'Municipal Administration Act'}</div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Identifier</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{currentOfficer?.email}</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1rem'
          }}
          onClick={() => setSettingsModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '2rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-md)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Department Settings</h3>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Administrative settings for <strong>{currentOfficer?.departmentName}</strong> are locked by the State Central Administration. For security protocol modifications or digital signature rotation, contact the department IT officer.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerLayout;
