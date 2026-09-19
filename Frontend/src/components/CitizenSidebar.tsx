import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building,
  FileText,
  Bot,
  Bell,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../mock/notifications';

interface CitizenSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CitizenSidebar: React.FC<CitizenSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (currentUser?.id) {
      setUnreadCount(notificationService.getUnreadCount(currentUser.id));
    } else {
      setUnreadCount(0);
    }
  }, [location.pathname, currentUser]);

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />
    },
    {
      to: '/services',
      label: 'Government Services',
      icon: <Building size={18} />
    },
    {
      to: '/applications',
      label: 'My Applications',
      icon: <FileText size={18} />
    },
    {
      to: '/assistant',
      label: 'AI Assistant',
      icon: <Bot size={18} />
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: <User size={18} />
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: <Settings size={18} />
    }
  ];

  const renderSidebarContent = (width: string, collapsed: boolean) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        width,
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '70px',
          padding: collapsed ? '0 0.5rem' : '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%' }}>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <Menu size={16} />
              </button>
            )}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}
              title="GovEaseAI Citizen Portal"
            >
              <ShieldCheck size={18} />
            </div>
          </div>
        ) : (
          <>
            <NavLink
              to="/dashboard"
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.15
                  }}
                >
                  GovEase<span style={{ color: 'var(--accent-cyan)' }}>AI</span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginTop: '2px'
                  }}
                >
                  Citizen Portal
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
                  padding: '0.4rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* User Info Strip in Sidebar */}
      <div
        style={{
          padding: collapsed ? '0.85rem 0.5rem' : '0.85rem 1.25rem',
          background: 'var(--bg-accent-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '0.75rem'
        }}
        title={currentUser?.fullName || currentUser?.name || 'Citizen'}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.85rem',
            flexShrink: 0
          }}
        >
          {loading ? '…' : (currentUser?.fullName?.charAt(0) || currentUser?.name?.charAt(0) || 'C')}
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {loading ? 'Loading citizen...' : currentUser ? (currentUser.fullName || currentUser.name || 'Citizen').split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Citizen'}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Applicant ID: {currentUser?.applicantId || (loading ? '…' : 'Pending')}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          padding: collapsed ? '1rem 0.35rem' : '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          overflowY: 'auto'
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.to === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '0.65rem 0.4rem' : '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent-blue-light, #3B82F6)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-accent-subtle)' : 'transparent',
                border: isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.18s ease',
                position: 'relative'
              }}
              className="sidebar-nav-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '0.75rem' }}>
                <span
                  style={{
                    color: isActive ? 'var(--accent-blue)' : 'inherit',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </div>
              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: collapsed ? '0.1rem 0.3rem' : '0.15rem 0.45rem',
                    borderRadius: '9999px',
                    background: 'var(--accent-blue)',
                    color: '#FFFFFF',
                    minWidth: collapsed ? '14px' : '18px',
                    textAlign: 'center',
                    ...(collapsed ? { position: 'absolute', top: '4px', right: '4px' } : {})
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--border-subtle)',
          margin: '0 0.75rem'
        }}
      />

      {/* Logout Action (Theme toggle removed to maintain single global toggle in header) */}
      <div style={{ padding: collapsed ? '0.75rem 0.35rem' : '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
          className="sidebar-logout-btn"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className="desktop-citizen-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: isCollapsed ? '72px' : '260px',
          zIndex: 40,
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {renderSidebarContent(isCollapsed ? '72px' : '260px', isCollapsed)}
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
            backgroundColor: 'rgba(7, 17, 31, 0.65)',
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
            width: '280px',
            maxWidth: '85vw',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)'
          }}
        >
          {renderSidebarContent('280px', false)}
        </div>
      </div>
    </>
  );
};

export default CitizenSidebar;
