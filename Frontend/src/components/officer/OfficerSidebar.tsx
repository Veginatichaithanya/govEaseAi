import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  UserCheck,
  LogOut,
  ShieldCheck,
  X
} from 'lucide-react';
import { officerAuth, type OfficerUser } from '../../mock/auth';
import { apiClient } from '../../services/apiClient';

interface OfficerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

interface SidebarStats {
  total: number;
  pendingReview: number;
  correctionRequired: number;
  approved: number;
  rejected: number;
}

export const OfficerSidebar: React.FC<OfficerSidebarProps> = ({
  isOpen,
  onClose,
  onOpenNotifications,
  onOpenProfile
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentOfficer: OfficerUser | null = officerAuth.getCurrentOfficer();

  const handleLogout = () => {
    officerAuth.logoutOfficer();
    if (onClose) onClose();
    navigate('/officer/login', { replace: true });
  };

  // Live PostgreSQL department statistics for sidebar badge counters
  const [stats, setStats] = useState<SidebarStats | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<boolean>(false);

  // Primitive stable keys to prevent infinite re-render fetch loop
  const officerId = currentOfficer?.officerId;
  const departmentId = currentOfficer?.departmentId;

  useEffect(() => {
    if (!departmentId) {
      setIsLoadingStats(false);
      return;
    }

    let isMounted = true;

    const fetchSidebarData = async () => {
      try {
        const [statsRes, notifsRes] = await Promise.all([
          apiClient.get(`/officer/dashboard/stats?departmentId=${encodeURIComponent(departmentId)}`),
          apiClient.get('/notifications/unread-count')
        ]);

        if (!isMounted) return;

        if (statsRes.ok && statsRes.data) {
          setStats({
            total: statsRes.data.total ?? 0,
            pendingReview: statsRes.data.pendingReview ?? 0,
            correctionRequired: statsRes.data.correctionRequired ?? 0,
            approved: statsRes.data.approved ?? 0,
            rejected: statsRes.data.rejected ?? 0
          });
          setStatsError(false);
        } else {
          setStatsError(true);
        }

        if (notifsRes.ok && typeof notifsRes.data?.unreadCount === 'number') {
          setUnreadNotifications(notifsRes.data.unreadCount);
        } else {
          setUnreadNotifications(0);
        }
      } catch {
        if (isMounted) {
          setStatsError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    };

    fetchSidebarData();
    window.addEventListener('govease_applications_updated', fetchSidebarData);
    window.addEventListener('govease_notifications_updated', fetchSidebarData);
    return () => {
      isMounted = false;
      window.removeEventListener('govease_applications_updated', fetchSidebarData);
      window.removeEventListener('govease_notifications_updated', fetchSidebarData);
    };
  }, [officerId, departmentId]);

  // Active route matching
  const pathname = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const statusParam = (searchParams.get('status') || '').toLowerCase();

  const isDashboardActive =
    (pathname === '/officer' || pathname === '/officer/dashboard') &&
    (!statusParam || statusParam === 'all');

  const isApplicationsActive =
    pathname === '/officer/applications' &&
    (!statusParam || statusParam === 'all');

  const isPendingActive =
    statusParam === 'pending';

  const isCorrectionActive =
    statusParam === 'correction' || statusParam === 'correction_required';

  const isApprovedActive =
    statusParam === 'approved';

  const isRejectedActive =
    statusParam === 'rejected';

  const isNotificationsActive =
    pathname === '/officer/notifications';

  const isProfileActive =
    pathname === '/officer/profile';

  // Badge count renderer with loading skeleton & error state
  const renderBadge = (count: number | null | undefined, badgeColor: string) => {
    if (isLoadingStats) {
      return (
        <span
          style={{
            width: '18px',
            height: '14px',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-secondary)',
            display: 'inline-block',
            opacity: 0.6
          }}
        />
      );
    }
    if (statsError || count === null || count === undefined) {
      return (
        <span
          style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}
        >
          —
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          padding: '0.12rem 0.42rem',
          borderRadius: '9999px',
          background: badgeColor,
          color: '#FFFFFF',
          minWidth: '20px',
          textAlign: 'center',
          lineHeight: '1.2'
        }}
      >
        {count}
      </span>
    );
  };

  const navItems = [
    {
      to: '/officer/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={17} />,
      isActive: isDashboardActive,
      badge: undefined
    },
    {
      to: '/officer/applications',
      label: 'Applications',
      icon: <Files size={17} />,
      isActive: isApplicationsActive,
      badge: stats?.total,
      badgeColor: isApplicationsActive ? 'var(--accent-blue)' : 'var(--bg-secondary)'
    },
    {
      to: '/officer/applications?status=pending',
      label: 'Pending Review',
      icon: <Clock size={17} />,
      isActive: isPendingActive,
      badge: stats?.pendingReview,
      badgeColor: isPendingActive ? '#0284C7' : 'rgba(2, 132, 199, 0.4)'
    },
    {
      to: '/officer/applications?status=correction_required',
      label: 'Correction Requests',
      icon: <AlertTriangle size={17} />,
      isActive: isCorrectionActive,
      badge: stats?.correctionRequired,
      badgeColor: isCorrectionActive ? '#D97706' : 'rgba(217, 119, 6, 0.4)'
    },
    {
      to: '/officer/applications?status=approved',
      label: 'Approved',
      icon: <CheckCircle2 size={17} />,
      isActive: isApprovedActive,
      badge: stats?.approved,
      badgeColor: isApprovedActive ? '#059669' : 'rgba(5, 150, 105, 0.4)'
    },
    {
      to: '/officer/applications?status=rejected',
      label: 'Rejected',
      icon: <XCircle size={17} />,
      isActive: isRejectedActive,
      badge: stats?.rejected,
      badgeColor: isRejectedActive ? '#DC2626' : 'rgba(220, 38, 38, 0.4)'
    }
  ];

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100vh',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        width: '260px',
        overflow: 'hidden'
      }}
    >
      {/* ── 1. Brand Header ── */}
      <div
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}
      >
        <NavLink
          to="/officer/dashboard"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.02rem',
                color: 'var(--text-primary)',
                lineHeight: 1.15
              }}
            >
              GovEase<span style={{ color: 'var(--accent-cyan)' }}>AI</span>
            </div>
            <div style={{ marginTop: '1px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: '#38BDF8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '0.04rem 0.32rem',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                Officer Portal
              </span>
            </div>
          </div>
        </NavLink>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mobile-sidebar-close"
            style={{
              display: 'none',
              padding: '0.3rem',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── 2. Department Context Card ── */}
      <div
        style={{
          padding: '0.45rem 1rem',
          background: 'var(--bg-accent-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.15rem',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'var(--accent-blue)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {currentOfficer?.departmentCode || 'DEPT'} JURISDICTION
          </span>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981',
              display: 'inline-block'
            }}
            title="Department Authority Connected"
          />
        </div>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={currentOfficer?.departmentName}
        >
          {currentOfficer?.departmentName || 'Government Department'}
        </div>
      </div>

      {/* ── 3. Main Navigation Section (Fits cleanly in 100vh) ── */}
      <nav
        className="officer-sidebar-nav"
        style={{
          flex: 1,
          padding: '0.45rem 0.6rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.12rem',
          overflowY: 'auto'
        }}
      >
        {/* WORK QUEUE HEADING */}
        <div
          style={{
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '0.2rem 0.6rem 0.1rem 0.6rem',
            letterSpacing: '0.06em',
            fontWeight: 600
          }}
        >
          Work Queue
        </div>

        {/* WORK QUEUE ITEMS */}
        {navItems.map((item) => {
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.38rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: item.isActive ? 600 : 500,
                color: item.isActive ? 'var(--accent-blue-light, #3B82F6)' : 'var(--text-secondary)',
                background: item.isActive ? 'var(--bg-accent-subtle)' : 'transparent',
                border: item.isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              className="sidebar-nav-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span
                  style={{
                    color: item.isActive ? 'var(--accent-blue)' : 'inherit',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && renderBadge(item.badge, item.badgeColor || 'var(--bg-secondary)')}
            </NavLink>
          );
        })}

        {/* ACCOUNT & SYSTEM HEADING */}
        <div
          style={{
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '0.45rem 0.6rem 0.1rem 0.6rem',
            letterSpacing: '0.06em',
            fontWeight: 600
          }}
        >
          Account &amp; System
        </div>

        {/* Notifications NavLink */}
        <NavLink
          to="/officer/notifications"
          onClick={() => {
            if (onOpenNotifications) onOpenNotifications();
            if (onClose) onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.38rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: isNotificationsActive ? 600 : 500,
            color: isNotificationsActive ? 'var(--accent-blue-light, #3B82F6)' : 'var(--text-secondary)',
            background: isNotificationsActive ? 'var(--bg-accent-subtle)' : 'transparent',
            border: isNotificationsActive ? '1px solid var(--border-accent)' : '1px solid transparent',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          className="sidebar-nav-item"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ color: isNotificationsActive ? 'var(--accent-blue)' : 'inherit', display: 'flex', alignItems: 'center' }}>
              <Bell size={16} />
            </span>
            <span>Notifications</span>
          </div>
          {renderBadge(
            unreadNotifications,
            unreadNotifications && unreadNotifications > 0 ? 'var(--accent-blue)' : 'var(--bg-secondary)'
          )}
        </NavLink>

        {/* Profile NavLink */}
        <NavLink
          to="/officer/profile"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            if (onClose) onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.38rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: isProfileActive ? 600 : 500,
            color: isProfileActive ? 'var(--accent-blue-light, #3B82F6)' : 'var(--text-secondary)',
            background: isProfileActive ? 'var(--bg-accent-subtle)' : 'transparent',
            border: isProfileActive ? '1px solid var(--border-accent)' : '1px solid transparent',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          className="sidebar-nav-item"
        >
          <span style={{ color: isProfileActive ? 'var(--accent-blue)' : 'inherit', display: 'flex', alignItems: 'center' }}>
            <UserCheck size={16} />
          </span>
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* ── 4. Pinned Logout Action at Bottom ── */}
      <div
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '0.45rem 0.6rem',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.42rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--status-danger, #EF4444)',
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          className="sidebar-logout-btn"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Fixed Viewport Height) */}
      <aside
        className="desktop-citizen-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          height: '100vh',
          width: '260px',
          zIndex: 40,
          overflow: 'hidden'
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-sidebar-drawer ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          zIndex: 100,
          pointerEvents: isOpen ? 'auto' : 'none',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'visibility 0.25s ease'
        }}
      >
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.25s ease'
          }}
        />

        {/* Slide-out Drawer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            height: '100vh',
            width: '270px',
            maxWidth: '85vw',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden'
          }}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default OfficerSidebar;
