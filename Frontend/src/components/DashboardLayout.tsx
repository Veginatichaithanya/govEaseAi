import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Menu, ShieldCheck, Search, Bell, X } from 'lucide-react';
import CitizenSidebar from './CitizenSidebar';
import FloatingAIAssistant from './FloatingAIAssistant';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../mock/notifications';

interface DashboardLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  noPadding?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  hideHeader = false,
  noPadding = false
}) => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (currentUser?.id) {
      setUnreadCount(notificationService.getUnreadCount(currentUser.id));
    }
    const handleNotifUpdate = () => {
      if (currentUser?.id) {
        setUnreadCount(notificationService.getUnreadCount(currentUser.id));
      }
    };
    window.addEventListener('govease_notifications_updated', handleNotifUpdate);
    return () => window.removeEventListener('govease_notifications_updated', handleNotifUpdate);
  }, [currentUser]);

  const handleToggleNavigation = () => {
    if (window.innerWidth <= 1024) {
      setMobileMenuOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex' }}>
      {/* Citizen Left Sidebar */}
      <CitizenSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
      />

      {/* Main Content Area */}
      <div
        className="dashboard-main-wrapper"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: isCollapsed ? '72px' : '260px',
          transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Responsive Global Citizen Header */}
        {!hideHeader && (
          <header
            className="dashboard-top-header"
            style={{
              height: '70px',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '0 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 30,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              gap: '1rem'
            }}
          >
            {/* Left: Hamburger Button + GovEaseAI Branding (Clean Horizontal Alignment) */}
            <div
              className="dashboard-header-left"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}
            >
              <button
                type="button"
                onClick={handleToggleNavigation}
                className={`dashboard-hamburger-btn ${isCollapsed ? 'is-collapsed' : ''}`}
                aria-label={mobileMenuOpen ? 'Close navigation' : (isCollapsed ? 'Expand sidebar' : 'Open navigation')}
                title={mobileMenuOpen ? 'Close navigation' : (isCollapsed ? 'Expand sidebar' : 'Toggle navigation')}
              >
                <Menu size={20} />
              </button>

              <NavLink
                to="/dashboard"
                style={{
                  display: isCollapsed ? 'flex' : undefined,
                  alignItems: 'center',
                  gap: '0.65rem',
                  textDecoration: 'none'
                }}
                className={`header-brand-link ${isCollapsed ? 'is-collapsed-visible' : ''}`}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
                    flexShrink: 0
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15
                    }}
                  >
                    GovEase<span style={{ color: 'var(--accent-cyan)' }}>AI</span>
                  </span>
                  <span
                    className="header-portal-subtitle"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Citizen Portal
                  </span>
                </div>
              </NavLink>
            </div>

            {/* Center: Search Government Services */}
            <div className="dashboard-header-center">
              <form
                onSubmit={handleSearchSubmit}
                className="header-search-container"
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search government services..."
                  className="header-search-input"
                  aria-label="Search government services"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </form>
            </div>

            {/* Right: Notifications, Theme Toggle, Profile Pill */}
            <div
              className="dashboard-header-right"
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}
            >
              {/* Notifications Button */}
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="header-notif-btn"
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="header-notif-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Single Global Theme Toggle */}
              <ThemeToggle />

              {/* Profile Pill */}
              <div
                onClick={() => navigate('/profile')}
                className="header-profile-pill"
                title="View citizen profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    flexShrink: 0
                  }}
                >
                  {loading ? '…' : (currentUser?.fullName?.charAt(0) || currentUser?.name?.charAt(0) || 'C')}
                </div>
                <div className="header-profile-text" style={{ lineHeight: 1.2 }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      display: 'block',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {loading ? 'Loading...' : (currentUser?.fullName || currentUser?.name || 'Citizen').split(' ')[0]}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--accent-blue)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {currentUser?.applicantId || 'Citizen'}
                  </span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Page Content */}
        <main className={`dashboard-main-content ${noPadding ? 'no-header-content' : ''}`}>
          {children}
        </main>
      </div>

      {/* Persistent Floating AI Assistant */}
      <FloatingAIAssistant />
    </div>
  );
};

export default DashboardLayout;
