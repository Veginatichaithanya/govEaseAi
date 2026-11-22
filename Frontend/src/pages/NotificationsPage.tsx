import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { authService, type AuthUser } from '../mock/auth';
import {
  notificationService,
  type NotificationItem
} from '../mock/notifications';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  ExternalLink
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authUser);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  useEffect(() => {
    const user = authUser || authService.getCurrentUser();
    setCurrentUser(user);

    if (user) {
      setNotifications(notificationService.getNotifications(user.id));
    } else {
      setNotifications([]);
    }
  }, [authUser]);

  const handleMarkAll = () => {
    if (currentUser) {
      notificationService.markAllAsRead(currentUser.id);
      setNotifications(notificationService.getNotifications(currentUser.id));
    }
  };

  const handleMarkSingle = (id: string) => {
    notificationService.markAsRead(id);
    if (currentUser) {
      setNotifications(notificationService.getNotifications(currentUser.id));
    }
  };

  const formatDate = (dateString: string) => {
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

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
              Notification Center
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Stay updated on status changes, officer remarks, and digital approvals.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-secondary)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  color: filter === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
                  background: filter === 'ALL' ? 'var(--accent-blue)' : 'transparent'
                }}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNREAD')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  color: filter === 'UNREAD' ? '#FFFFFF' : 'var(--text-secondary)',
                  background: filter === 'UNREAD' ? 'var(--accent-blue)' : 'transparent'
                }}
              >
                Unread ({notifications.filter((n) => !n.read).length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleMarkAll}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
            >
              <CheckCheck size={15} /> Mark All Read
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
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
              <Bell size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              No notifications to display
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              You're all caught up! Updates regarding your applications will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filtered.map((n) => (
              <div
                key={n.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  background: n.read ? 'var(--bg-card)' : 'var(--bg-accent-subtle)',
                  border: n.read ? '1px solid var(--border-subtle)' : '1px solid var(--border-accent)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background:
                        n.type === 'warning'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : n.type === 'success'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(37, 99, 235, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color:
                        n.type === 'warning'
                          ? 'var(--status-warning)'
                          : n.type === 'success'
                          ? 'var(--status-success)'
                          : 'var(--accent-blue)',
                      flexShrink: 0
                    }}
                  >
                    {n.type === 'warning' ? (
                      <AlertTriangle size={18} />
                    ) : n.type === 'success' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Info size={18} />
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontSize: '0.975rem', fontWeight: n.read ? 600 : 700, color: 'var(--text-primary)', margin: 0 }}>
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.05rem 0.4rem' }}>
                          New
                        </span>
                      )}
                      {n.relatedApplicationId && (
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {n.relatedApplicationId}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                      {n.description}
                    </p>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {formatDate(n.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingle(n.id)}
                      style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem 0.65rem' }}
                    >
                      Mark read
                    </button>
                  )}
                  {n.actionUrl && (
                    <Link
                      to={n.actionUrl}
                      onClick={() => handleMarkSingle(n.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                    >
                      View <ExternalLink size={13} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
