import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Sliders,
  Server,
  Zap
} from 'lucide-react';
import {
  DEPARTMENT_OPTIONS,
  GOVERNMENT_DEPARTMENTS
} from '../../config/governmentDepartments';
import { officerAuth } from '../../mock/auth';
import ThemeToggle from '../../components/ThemeToggle';
import {
  pingApiHealth,
  getApiBaseUrl,
  getStoredApiUrl,
  setStoredApiUrl,
  type HealthCheckResult
} from '../../services/apiClient';

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

export const OfficerLoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Initial department: Municipal Licensing Division
  const defaultDept = GOVERNMENT_DEPARTMENTS['municipal-licensing'];
  const [selectedDeptId, setSelectedDeptId] = useState<string>('municipal-licensing');
  const [email, setEmail] = useState<string>(defaultDept?.defaultOfficer?.email || 'licensing@goveaseai.gov');
  const [password, setPassword] = useState<string>(defaultDept?.defaultOfficer?.password || 'License@123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Diagnostic state
  const [apiHealth, setApiHealth] = useState<HealthCheckResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(getStoredApiUrl() || getApiBaseUrl());

  const wakeUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const probeBackendHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await pingApiHealth(10000);
      setApiHealth(res);
    } catch {
      setApiHealth({ ok: false, status: 0, latencyMs: 0, url: getApiBaseUrl() });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    probeBackendHealth();
  }, []);

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

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const dept = GOVERNMENT_DEPARTMENTS[deptId];
    if (dept?.defaultOfficer) {
      setEmail(dept.defaultOfficer.email);
      setPassword(dept.defaultOfficer.password);
    }
    setEmailError('');
    setPasswordError('');
    setErrorMessage(null);
  };

  const mapErrorToMessage = (error: string): string => {
    const lower = error.toLowerCase();
    if (
      lower.includes('match') ||
      lower.includes('selected office') ||
      lower.includes('assigned') ||
      lower.includes('not authorized for this department')
    ) {
      return 'Selected office does not match this officer account.';
    }
    if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('password')) {
      return 'Invalid email or password.';
    }
    if (lower.includes('deactivated') || lower.includes('inactive') || lower.includes('active')) {
      return 'Your officer account is inactive.';
    }
    if (lower.includes('connect') || lower.includes('network') || lower.includes('server') || lower.includes('unavailable')) {
      return 'Unable to connect to the Government Officer Portal backend. If Render is sleeping, it may take ~45s to wake up.';
    }
    return error;
  };

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage(null);

    if (!email.trim()) {
      setEmailError('Officer email is required.');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    }
    if (!selectedDeptId) {
      setErrorMessage('Please select an authorized government department.');
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
    setErrorMessage(null);

    // If server takes longer than 2.5 seconds (Render cold start), notify user
    wakeUpTimerRef.current = setTimeout(() => {
      setIsWakingUp(true);
    }, 2500);

    try {
      // Authenticate against PostgreSQL backend (POST /api/auth/officer/login)
      const result = await officerAuth.loginOfficerAsync(selectedDeptId, email.trim(), password);

      if (wakeUpTimerRef.current) clearTimeout(wakeUpTimerRef.current);

      if (result.success) {
        navigate('/officer/dashboard', { replace: true });
        return;
      }

      // Backend returned error (e.g. 403 office mismatch, 401 invalid credentials)
      if (result.error) {
        setErrorMessage(mapErrorToMessage(result.error));
        return;
      }

      setErrorMessage('Authentication failed. Please verify your credentials.');
    } catch {
      setErrorMessage('Unable to connect to the Government Officer Portal backend. Please wait a moment and try again.');
    } finally {
      if (wakeUpTimerRef.current) clearTimeout(wakeUpTimerRef.current);
      setIsLoading(false);
      setIsWakingUp(false);
    }
  };

  const activeDept = GOVERNMENT_DEPARTMENTS[selectedDeptId] || DEPARTMENT_OPTIONS[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-glass)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--text-secondary)',
              fontSize: '0.86rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} /> Public Portal
          </Link>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span
            style={{
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-blue-light)',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(37, 99, 235, 0.25)'
            }}
          >
            Statutory Administration Interface
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
          >
            Citizen Sign In
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          flex: 1
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '480px',
            padding: '2.5rem',
            border: '1px solid var(--border-accent)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
                border: '1px solid rgba(147, 197, 253, 0.3)'
              }}
            >
              <ShieldCheck size={28} color="#FFFFFF" strokeWidth={2.2} />
            </div>

            <h1
              style={{
                fontSize: '1.6rem',
                color: 'var(--text-primary)',
                marginBottom: '0.3rem',
                fontWeight: 700,
                letterSpacing: '-0.02em'
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
              Government Officer Portal
            </p>
          </div>

          {/* Backend Status Diagnostic Pill */}
          <div
            style={{
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
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
              <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {isCheckingHealth ? (
                  'Checking API status...'
                ) : apiHealth?.ok ? (
                  <>Backend Online ({apiHealth.latencyMs}ms)</>
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
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
              >
                <RefreshCw size={13} style={{ animation: isCheckingHealth ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button
                type="button"
                onClick={() => setShowApiConfig(!showApiConfig)}
                title="Configure Backend URL"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
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

          {/* Quick Department Select Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Zap size={13} color="var(--accent-blue-light)" /> Quick Department Accounts:
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {DEPARTMENT_OPTIONS.map((dept) => (
                <button
                  key={dept.departmentId}
                  type="button"
                  onClick={() => handleDepartmentChange(dept.departmentId)}
                  style={{
                    background: selectedDeptId === dept.departmentId ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${selectedDeptId === dept.departmentId ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    color: selectedDeptId === dept.departmentId ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                    borderRadius: '12px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {dept.departmentCode}
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}
          >
            {/* Error banner */}
            {errorMessage && (
              <div
                style={{
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
                }}
                role="alert"
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Cold Start Notice */}
            {isWakingUp && !errorMessage && (
              <div style={warningBanner} role="status">
                <Loader2 size={17} style={{ flexShrink: 0, marginTop: '2px', animation: 'spin 1s linear infinite' }} />
                <span>
                  <strong>Waking up server:</strong> Render free-tier instances sleep when inactive and take ~30–45s to spin up. Verifying officer credentials...
                </span>
              </div>
            )}

            {/* Department selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="officer-department" className="form-label">
                Department / Authority
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="officer-department"
                  value={selectedDeptId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="login-input"
                  style={{
                    appearance: 'none',
                    paddingRight: '2.5rem',
                    cursor: 'pointer'
                  }}
                  disabled={isLoading}
                >
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName} ({dept.departmentCode})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--text-muted)'
                  }}
                />
              </div>

              {/* Department preview pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <Building2 size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
                <span>
                  Authorized for: <strong style={{ color: 'var(--text-primary)' }}>{activeDept.serviceName}</strong>
                </span>
              </div>
            </div>

            {/* Email input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="officer-email" className="form-label">
                Official Email Address
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
                  id="officer-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setErrorMessage(null);
                  }}
                  placeholder="officer@goveaseai.gov"
                  className="login-input"
                  style={{ paddingLeft: '2.5rem' }}
                  autoComplete="username"
                  disabled={isLoading}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'officer-email-error' : undefined}
                />
              </div>
              {emailError && (
                <span
                  id="officer-email-error"
                  style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.15rem' }}
                >
                  {emailError}
                </span>
              )}
            </div>

            {/* Password input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="officer-password" className="form-label">
                Password
              </label>
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
                  id="officer-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setErrorMessage(null);
                  }}
                  placeholder="Enter officer password"
                  className="login-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  autoComplete="current-password"
                  disabled={isLoading}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'officer-password-error' : undefined}
                />
                <button
                  type="button"
                  style={eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <span
                  id="officer-password-error"
                  style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.15rem' }}
                >
                  {passwordError}
                </span>
              )}
            </div>

            {/* Submit button */}
            <button
              id="officer-signin-btn"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                marginTop: '0.5rem',
                fontSize: '0.95rem',
                opacity: isLoading ? 0.75 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                  {isWakingUp ? 'Waking up Server...' : 'Authenticating...'}
                </>
              ) : (
                <>
                  Enter Officer Dashboard <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
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
        GovEaseAI — Government Officer Portal
      </footer>
    </div>
  );
};

export default OfficerLoginPage;
