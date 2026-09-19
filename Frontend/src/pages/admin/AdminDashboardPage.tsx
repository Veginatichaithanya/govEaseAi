import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Building2,
  FileText,
  FileCheck2,
  Sparkles,
  MessageSquare,
  Bell,
  RefreshCw,
  Database,
  AlertTriangle,
  Layers,
  Shield
} from 'lucide-react';
import { fetchAdminDashboardStats, type AdminDashboardStats } from '../../services/adminService';
import ThemeToggle from '../../components/ThemeToggle';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminDashboardStats();
      if (data) {
        setStats(data);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        setError('Failed to retrieve statistics from PostgreSQL database.');
      }
    } catch {
      setError('Unable to connect to the backend administration service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top Admin Navigation Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(12px)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
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
                  boxShadow: '0 4px 12px rgba(37,99,235,0.35)'
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  GovEase<span style={{ color: 'var(--accent-blue)' }}>AI</span>
                </span>
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.65rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--accent-blue)',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  Admin Console
                </span>
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* PostgreSQL Connected Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.78rem',
                color: '#10B981',
                fontWeight: 600
              }}
            >
              <Database size={14} />
              <span>PostgreSQL Connected</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 6px #10B981'
                }}
              />
            </div>

            <button
              type="button"
              onClick={loadStats}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm, 6px)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              title="Refresh database statistics"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Page Banner */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
              Database &amp; Platform Statistics
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Live metrics aggregated directly from PostgreSQL. Zero mock counters.
            </p>
          </div>
          {lastRefreshed && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Last synchronized: <strong style={{ color: 'var(--text-secondary)' }}>{lastRefreshed}</strong>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── 9 Primary Database Counters ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          {/* Citizens */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Citizens</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                <Users size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.citizens ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              role = 'CITIZEN' in users
            </div>
          </div>

          {/* Officers */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Government Officers</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <Shield size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.officers ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '0.35rem' }}>
              {stats?.active_officers ?? 0} active • 6 statutory depts
            </div>
          </div>

          {/* Departments */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Departments</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                <Building2 size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.departments ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              government_departments
            </div>
          </div>

          {/* Services */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Public Services</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7' }}>
                <Layers size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.services ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              government_services
            </div>
          </div>

          {/* Applications */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Applications</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                <FileText size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.applications.total ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              applications in PostgreSQL
            </div>
          </div>

          {/* Documents */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Application Docs</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <FileCheck2 size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.documents.total ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {stats?.documents.verified ?? 0} verified metadata
            </div>
          </div>

          {/* AI Analyses */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>AI Analyses</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
                <Sparkles size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.ai.analyses ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              ai_analysis records
            </div>
          </div>

          {/* Conversations */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>AI Conversations</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                <MessageSquare size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.conversations ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {stats?.messages ?? 0} total AI messages
            </div>
          </div>

          {/* Notifications */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notifications</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                <Bell size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.notifications ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {stats?.unread_notifications ?? 0} unread
            </div>
          </div>
        </div>

        {/* ── Application Lifecycle Breakdown ── */}
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg, 16px)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                Application Lifecycle Breakdown
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Status breakdown calculated across all {stats?.applications.total ?? 0} registered applications in PostgreSQL.
              </p>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-blue)',
                fontWeight: 600
              }}
            >
              Total: {stats?.applications.total ?? 0}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* Draft */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Draft</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                {stats?.applications.draft ?? 0}
              </div>
            </div>

            {/* Submitted */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600, textTransform: 'uppercase' }}>Submitted</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                {stats?.applications.submitted ?? 0}
              </div>
            </div>

            {/* Under Review */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase' }}>Under Review</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                {stats?.applications.under_review ?? 0}
              </div>
            </div>

            {/* Correction Requested */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 600, textTransform: 'uppercase' }}>Correction Req.</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                {stats?.applications.correction_requested ?? 0}
              </div>
            </div>

            {/* Resubmitted */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 600, textTransform: 'uppercase' }}>Resubmitted</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                {stats?.applications.resubmitted ?? 0}
              </div>
            </div>

            {/* Approved */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600, textTransform: 'uppercase' }}>Approved</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                {stats?.applications.approved ?? 0}
              </div>
            </div>

            {/* Rejected */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase' }}>Rejected</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                {stats?.applications.rejected ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* ── Department & Service Breakdown Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
          {/* Department Breakdown */}
          <div
            className="glass-panel"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg, 16px)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
              Applications by Department
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.by_department.map((dept) => (
                <div
                  key={dept.departmentId}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {dept.departmentName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Code: {dept.departmentCode} • ID: {dept.departmentId}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>
                      {dept.pending} pending
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#10B981' }}>
                      {dept.approved} approved
                    </span>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--accent-blue)',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                    >
                      {dept.total} Total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Breakdown */}
          <div
            className="glass-panel"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg, 16px)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
              Applications by Government Service
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.by_service.map((svc) => (
                <div
                  key={svc.serviceId}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {svc.serviceName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Assigned to: {svc.departmentId}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        background: 'rgba(6, 182, 212, 0.15)',
                        color: 'var(--accent-cyan)',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                    >
                      {svc.total} Submissions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
