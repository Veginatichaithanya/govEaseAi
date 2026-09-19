import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  Bell,
  Check,
  Globe,
  Cpu
} from 'lucide-react';
import { mockAIService } from '../mock/aiService';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [officerAlerts, setOfficerAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Portal Settings
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Customize your appearance, notification preferences, and account configuration.
        </p>

        {savedMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-success-bg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--status-success)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Check size={16} /> Preferences saved successfully!
          </div>
        )}

        {/* Section 1: Appearance (Light / Dark Mode using existing ThemeContext) */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.75rem'
          }}
        >
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Appearance &amp; Theme
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Choose your preferred interface theme. Selected theme is saved automatically across browser sessions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Dark Mode Card */}
            <div
              onClick={() => setTheme('dark')}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#07111F',
                border: theme === 'dark' ? '2px solid var(--accent-blue)' : '1px solid rgba(148, 163, 184, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <Moon size={18} color="#60A5FA" />
                <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>Dark Theme</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>
                Deep GovTech navy palette with cyan and electric blue accents.
              </p>
              {theme === 'dark' && (
                <span className="badge badge-info" style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.68rem' }}>
                  Active
                </span>
              )}
            </div>

            {/* Light Mode Card */}
            <div
              onClick={() => setTheme('light')}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#FFFFFF',
                border: theme === 'light' ? '2px solid var(--accent-blue)' : '1px solid #CBD5E1',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <Sun size={18} color="#2563EB" />
                <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>Light Theme</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                Clean, crisp government portal design with high-contrast slate typography.
              </p>
              {theme === 'light' && (
                <span className="badge badge-info" style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.68rem' }}>
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Notification Preferences */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <Bell size={20} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
              Notification Preferences
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Control which status events send notifications to your dashboard.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Desk Scrutiny &amp; Officer Review Alerts
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Receive instant alerts when an officer requests corrections or updates your status.
                </div>
              </div>
              <input
                type="checkbox"
                checked={officerAlerts}
                onChange={(e) => setOfficerAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Digital Sanction &amp; Approval Notifications
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Notify me immediately when an application is formally sanctioned.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  SMS / Mobile Dispatch Updates
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Send prototype milestone SMS dispatch tokens to registered mobile number.
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {/* Section 3: Regional & Language Settings */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <Globe size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
              Language &amp; Localization
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Portal language configuration for forms and AI assistant output.
          </p>

          <div style={{ maxWidth: '360px' }}>
            <select
              defaultValue="en"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--input-text)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            >
              <option value="en">English (Official Government Portal Default)</option>
              <option value="te" disabled>Telugu (Coming in Phase 2)</option>
              <option value="hi" disabled>Hindi (Coming in Phase 2)</option>
            </select>
          </div>
        </div>

        {/* Section 4: AI & OpenRouter Integration */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Cpu size={20} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
                AI Guidance &amp; LLM Configuration
              </h3>
            </div>
            {(() => {
              const status = mockAIService.getOpenRouterStatus();
              return (
                <span
                  className={`badge ${status.connected ? 'badge-success' : 'badge-neutral'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                >
                  {status.connected ? '● OpenRouter Active' : '● Local Fallback Active'}
                </span>
              );
            })()}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            GovEaseAI integrates with OpenRouter for intelligent citizen assistance, service queries, and document verification.
          </p>

          {(() => {
            const status = mockAIService.getOpenRouterStatus();
            return (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>AI Engine Provider</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>OpenRouter API</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Configured Model</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 600 }}>{status.model}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>API Key Status</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{status.keyMasked}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.85rem', fontSize: '0.925rem' }}
        >
          Save Preferences
        </button>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
