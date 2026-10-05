import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sliders,
  Server,
  Mail,
  Lock
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  pingApiHealth,
  getApiBaseUrl,
  getStoredApiUrl,
  setStoredApiUrl,
  type HealthCheckResult
} from '../services/apiClient';

/* ─────────────────────────────────────────────────
   Inline helper styles
───────────────────────────────────────────────── */
const eyeBtn: React.CSSProperties = {
  position: 'absolute',
  right: '0.85rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  padding: '0.25rem',
  transition: 'color 0.2s ease'
};

const errorBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.65rem',
  padding: '0.85rem 1rem',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#F87171',
  fontSize: '0.84rem',
  lineHeight: '1.4'
};

const warningBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.65rem',
  padding: '0.75rem 0.95rem',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(245, 158, 11, 0.12)',
  border: '1px solid rgba(245, 158, 11, 0.35)',
  color: '#FBBF24',
  fontSize: '0.82rem',
  lineHeight: '1.4'
};

const successBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  padding: '0.85rem 1rem',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(16, 185, 129, 0.12)',
  border: '1px solid rgba(16, 185, 129, 0.35)',
  color: '#34D399',
  fontSize: '0.84rem',
  lineHeight: '1.4'
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const regIdentifier = (location.state as any)?.registeredIdentifier || '';
  const regName = (location.state as any)?.registeredName || '';

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const wakeUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [identifier, setIdentifier] = useState(regIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(
    regIdentifier ? `Account created for ${regName || regIdentifier}! Please enter your password to sign in.` : null
  );

  // Field-level validation errors
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Backend Health Diagnostic & Cloud URL Config State
  const [apiHealth, setApiHealth] = useState<HealthCheckResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(getStoredApiUrl() || getApiBaseUrl());

  const probeBackendHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const result = await pingApiHealth(10000);
      setApiHealth(result);
    } catch {
      setApiHealth({ ok: false, status: 0, latencyMs: 0, url: getApiBaseUrl() });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    probeBackendHealth();
  }, []);

  // If redirected from signup, focus password field immediately
  useEffect(() => {
    if (regIdentifier && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [regIdentifier]);


  const handleSaveApiUrl = () => {
    setStoredApiUrl(customUrlInput);
    setShowApiConfig(false);
    probeBackendHealth();
  };

  const handleResetApiUrl = () => {
    setStoredApiUrl(null);
    setCustomUrlInput(getApiBaseUrl());
    setShowApiConfig(false);
    probeBackendHealth();
  };

  const validateForm = (): boolean => {
    let valid = true;
    setIdentifierError('');
    setPasswordError('');
    setErrorMsg(null);

    if (!identifier.trim()) {
      setIdentifierError('Email is required.');
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError('Password is required.');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isLoading) return;

    setIsLoading(true);
    setIsWakingUp(false);
    setErrorMsg(null);
    setSuccessNotice(null);

    // If server takes longer than 2.5 seconds (Render cold-start spin-up), inform user
    wakeUpTimerRef.current = setTimeout(() => {
      setIsWakingUp(true);
    }, 2500);

    try {
      const cleanIdent = identifier.trim();
      const cleanPass = password.trim();
      const result = await login(cleanIdent, cleanPass);

      if (wakeUpTimerRef.current) clearTimeout(wakeUpTimerRef.current);

      if (result.success) {
        navigate('/dashboard');
      } else {
        // Map known backend messages to user-friendly text
        const msg = result.error || 'Login failed. Please try again.';
        if (
          msg.toLowerCase().includes('invalid') ||
          msg.toLowerCase().includes('credentials') ||
          msg.toLowerCase().includes('password')
        ) {
          setErrorMsg('Invalid email or password.');
        } else if (
          msg.toLowerCase().includes('deactivated') ||
          msg.toLowerCase().includes('inactive')
        ) {
          setErrorMsg('Your account is inactive. Please contact the administrator.');
        } else if (
          msg.toLowerCase().includes('connect') ||
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('server')
        ) {
          setErrorMsg('Unable to connect to the backend server. If the server is in sleep mode, it may take up to 45 seconds to wake up. Please try again.');
        } else {
          setErrorMsg(msg);
        }
      }
    } catch {
      setErrorMsg('Unable to connect to the backend server. If Render free tier is waking up, please wait a few seconds and try again.');
    } finally {
      if (wakeUpTimerRef.current) clearTimeout(wakeUpTimerRef.current);
      setIsLoading(false);
      setIsWakingUp(false);
    }
  };

  const handleOfficerTabClick = () => {
    navigate('/officer/login');
  };

  return (
    <div
      className="auth-page-wrapper"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* ── Top Header Strip ── */}
      <header
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <ThemeToggle />
      </header>

      {/* ── Main Content ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div
          className="glass-panel auth-card hover-lift"
        >
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div className="auth-brand-badge">
              <ShieldCheck size={28} color="#FFFFFF" strokeWidth={2.2} />
            </div>

            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '0.25rem',
                letterSpacing: '-0.025em'
              }}
            >
              GovEaseAI
            </h1>
            <p
              style={{
                fontSize: '0.86rem',
                color: 'var(--text-secondary)',
                margin: 0
              }}
            >
              Simplifying Government Services
            </p>
          </div>

          {/* Backend Status Diagnostic Pill */}
          <div className="backend-status-pill">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundColor: isCheckingHealth
                    ? '#FBBF24'
                    : apiHealth?.ok
                    ? '#10B981'
                    : '#F87171',
                  boxShadow: apiHealth?.ok ? '0 0 8px rgba(16, 185, 129, 0.6)' : undefined
                }}
              />
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {isCheckingHealth ? (
                  'Checking API status...'
                ) : apiHealth?.ok ? (
                  <>Backend Online <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, opacity: 0.85 }}>({apiHealth.latencyMs}ms)</span></>
                ) : (
                  'Backend Offline / Waking up'
                )}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={probeBackendHealth}
                disabled={isCheckingHealth}
                title="Ping backend server"
                className="backend-status-btn"
              >
                <RefreshCw size={13} style={{ animation: isCheckingHealth ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button
                type="button"
                onClick={() => setShowApiConfig(!showApiConfig)}
                title="Configure Backend URL"
                className="backend-status-btn"
              >
                <Sliders size={13} />
              </button>
            </div>
          </div>

          {/* Collapsible API URL Configurator for Render */}
          {showApiConfig && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-accent)',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Server size={13} color="var(--accent-blue-light)" /> Backend API URL
                </span>
                <button
                  type="button"
                  onClick={handleResetApiUrl}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--accent-blue-light)',
                    fontSize: '0.74rem',
                    textDecoration: 'underline'
                  }}
                >
                  Reset default
                </button>
              </div>
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://goveaseai-backend.onrender.com"
                className="login-input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowApiConfig(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                >
                  Save & Connect
                </button>
              </div>
            </div>
          )}

          {/* Portal selector tabs */}
          <div className="role-selector-container" style={{ marginBottom: '1.5rem' }}>
            {/* Citizen tab — active */}
            <button
              type="button"
              className="role-tab-btn active"
              aria-pressed={true}
            >
              <User size={15} /> Citizen Applicant
            </button>

            {/* Officer tab — clicking navigates away */}
            <button
              type="button"
              className="role-tab-btn"
              aria-pressed={false}
              onClick={handleOfficerTabClick}
            >
              <UserCheck size={15} /> Licensing Officer
            </button>
          </div>



          {/* Card heading */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h2
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.2rem',
                letterSpacing: '-0.015em'
              }}
            >
              Welcome Back
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Sign in to your citizen account
            </p>
          </div>

          {/* ── Login Form ── */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
          >
            {/* Success notice after registration */}
            {successNotice && (
              <div style={successBanner} role="status">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Adaptive Render Cold-Start Notice */}
            {isWakingUp && !errorMsg && (
              <div style={warningBanner} role="status">
                <Loader2 size={17} style={{ flexShrink: 0, marginTop: '2px', animation: 'spin 1s linear infinite' }} />
                <span>
                  <strong>Waking up server:</strong> Render free-tier instances sleep when inactive and take ~30–45s to spin up. Authenticating...
                </span>
              </div>
            )}

            {/* Email / Mobile Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="login-identifier" className="form-label">
                Email or Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setIdentifierError('');
                    setErrorMsg(null);
                    setSuccessNotice(null);
                  }}
                  placeholder="name@example.com or 10-digit mobile"
                  className={`login-input ${identifierError ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  autoComplete="username email"
                  disabled={isLoading}
                  aria-invalid={!!identifierError}
                  aria-describedby={identifierError ? 'identifier-error' : undefined}
                />
              </div>
              {identifierError && (
                <span
                  id="identifier-error"
                  style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.1rem', paddingLeft: '0.25rem' }}
                >
                  {identifierError}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password" className="form-label" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  id="forgot-password-link"
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--accent-blue-light)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  ref={passwordInputRef}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setErrorMsg(null);
                    setSuccessNotice(null);
                  }}
                  placeholder="Enter your password"
                  className={`login-input ${passwordError ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.85rem' }}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={isLoading}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  style={eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && (
                <span
                  id="password-error"
                  style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.1rem', paddingLeft: '0.25rem' }}
                >
                  {passwordError}
                </span>
              )}
            </div>

            {/* API error banner */}
            {errorMsg && (
              <div style={errorBanner} role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="citizen-signin-btn"
              type="submit"
              disabled={isLoading}
              className="auth-submit-btn hover-lift"
              style={{
                marginTop: '0.4rem',
                opacity: isLoading ? 0.75 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                  {isWakingUp ? 'Waking up Server...' : 'Signing In...'}
                </>
              ) : (
                <>
                  Sign In to Portal <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Government Portal Link */}
          <div className="auth-switch-box">
            Government official?{' '}
            <Link
              to="/officer/login"
              style={{
                color: 'var(--accent-blue)',
                fontWeight: 700,
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Sign in to Government Officer Portal
            </Link>
          </div>

          {/* Footer link to signup */}
          <div
            style={{
              marginTop: '1.25rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: 'var(--accent-blue)',
                fontWeight: 700,
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.25rem',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        GovEaseAI — AI-Powered Government Service Platform
      </footer>
    </div>
  );
};

export default LoginPage;
