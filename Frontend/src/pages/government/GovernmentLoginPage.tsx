import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  HelpCircle,
  X,
  Info,
} from 'lucide-react';
import { useGovernmentAuth } from '../../context/GovernmentAuthContext';
import { MOCK_OFFICER_LIST, DEMO_ROLE_CREDENTIALS } from '../../mock/governmentAuth';
import ThemeToggle from '../../components/ThemeToggle';

// ── Style helpers ──────────────────────────────────────────────────────────

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
  transition: 'color 0.2s ease',
};

// ── Forgot Password Modal ──────────────────────────────────────────────────

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem',
    }}
    onClick={onClose}
  >
    <div
      className="glass-panel"
      style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-accent)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '0.25rem',
        }}
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <HelpCircle size={20} color="#fff" />
        </div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Forgot Password?
        </h2>
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        Government officer passwords are managed by the system administrator.
        If you cannot sign in, please contact your IT department or the GovEaseAI admin.
      </p>

      <div
        style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem',
        }}
      >
        <Info size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Role-Based Credentials:</strong> Passwords are verified directly against PostgreSQL in the database.
          Click <em>"Show Demo Credentials"</em> below to inspect official credentials for all 7 officer roles.
        </div>
      </div>

      <button
        onClick={onClose}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
      >
        Understood
      </button>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

export const GovernmentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useGovernmentAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showDemoHints, setShowDemoHints] = useState(false);

  const from = (location.state as any)?.from || null;

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage(null);
    if (!email.trim()) {
      setEmailError('Government email address is required.');
      valid = false;
    } else if (!email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || loading) return;

    const result = await login(email.trim(), password, rememberMe);
    if (result.success && result.officer) {
      const dest = from || result.officer.dashboardRoute;
      navigate(dest, { replace: true });
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    const pass = DEMO_ROLE_CREDENTIALS[demoEmail]?.passwordHint || '';
    setPassword(pass);
    setEmailError('');
    setPasswordError('');
    setErrorMessage(null);
    setShowDemoHints(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-glass)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
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
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} /> Public Portal
          </Link>

          <span style={{ color: 'var(--border-subtle)', fontSize: '0.9rem' }}>|</span>

          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldCheck size={16} color="var(--accent-cyan)" />
            Government Officer Portal
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
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '500px' }}>
          {/* Card */}
          <div
            className="glass-panel"
            style={{
              padding: '2.5rem',
              border: '1px solid var(--border-accent)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {/* Brand */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                }}
              >
                <ShieldCheck size={30} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <h1
                style={{
                  fontSize: '1.6rem',
                  color: 'var(--text-primary)',
                  marginBottom: '0.3rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                GovEaseAI
              </h1>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                Authorized Government Officer Access
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {/* Email */}
              <div>
                <label
                  htmlFor="govt-email"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Mail size={15} color="var(--text-secondary)" />
                  Government Email
                </label>
                <input
                  id="govt-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setErrorMessage(null);
                  }}
                  placeholder="officer@goveaseai.gov"
                  className="login-input"
                  autoComplete="username"
                  required
                  disabled={loading}
                  aria-invalid={!!emailError}
                />
                {emailError && (
                  <span style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.25rem', display: 'block' }}>
                    {emailError}
                  </span>
                )}
              </div>

              {/* Password */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <label
                    htmlFor="govt-password"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Lock size={15} color="var(--text-secondary)" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--accent-blue)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="govt-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                      setErrorMessage(null);
                    }}
                    placeholder="Enter your password"
                    className="login-input"
                    style={{ paddingRight: '3rem' }}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    aria-invalid={!!passwordError}
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
                  <span style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.25rem', display: 'block' }}>
                    {passwordError}
                  </span>
                )}
              </div>

              {/* Remember Me */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  id="govt-remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                  disabled={loading}
                />
                Remember me for 30 days
              </label>

              {/* Error Banner */}
              {errorMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#F87171',
                    fontSize: '0.82rem',
                    lineHeight: '1.4',
                  }}
                  role="alert"
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="govt-signin-btn"
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Officer Portal <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials Section */}
          <div style={{ marginTop: '1.25rem' }}>
            <button
              onClick={() => setShowDemoHints((v) => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(37, 99, 235, 0.07)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--accent-blue)',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'background 0.2s ease',
              }}
            >
              <Info size={15} />
              {showDemoHints ? 'Hide' : 'Show'} Demo Credentials
            </button>

            {showDemoHints && (
              <div
                style={{
                  marginTop: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '0.6rem 1rem',
                    background: 'rgba(37, 99, 235, 0.08)',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Database-Backed Demo Accounts (7 Roles)
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {MOCK_OFFICER_LIST.map((o) => {
                    const passHint = DEMO_ROLE_CREDENTIALS[o.email]?.passwordHint || '';
                    return (
                      <button
                        key={o.email}
                        onClick={() => handleDemoFill(o.email)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(37, 99, 235, 0.06)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {o.email}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            {o.roleDisplayName} — {o.department}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                            Password: {passHint}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            background: 'rgba(37, 99, 235, 0.12)',
                            color: 'var(--accent-blue)',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          Use
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Back to old officer portal */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '1rem',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
            }}
          >
            Looking for the legacy portal?{' '}
            <Link
              to="/officer/login"
              style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}
            >
              Department Login
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.25rem',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        GovEaseAI — Government Officer Portal · Secure Access Only
      </footer>

      {/* Forgot Password Modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
};

export default GovernmentLoginPage;
