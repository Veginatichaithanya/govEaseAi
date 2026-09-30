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
  Loader2
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

/* ─────────────────────────────────────────────────
   Inline helper styles
───────────────────────────────────────────────── */
const fieldWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem'
};

const passwordWrap: React.CSSProperties = {
  position: 'relative'
};

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

  // Form state
  const [identifier, setIdentifier] = useState(regIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(
    regIdentifier ? `Account created for ${regName || regIdentifier}! Please enter your password to sign in.` : null
  );

  // Field-level validation errors
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // If redirected from signup, focus password field immediately
  useEffect(() => {
    if (regIdentifier && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [regIdentifier]);

  const validateForm = (): boolean => {
    let valid = true;
    setIdentifierError('');
    setPasswordError('');
    setErrorMsg(null);

    if (!identifier.trim()) {
      setIdentifierError('Email or Mobile Number is required.');
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
    setErrorMsg(null);
    setSuccessNotice(null);

    try {
      const cleanIdent = identifier.trim();
      const cleanPass = password.trim();
      const result = await login(cleanIdent, cleanPass);

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
          setErrorMsg('Invalid phone number/email or password.');
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
          setErrorMsg('Unable to connect to the server. Please try again.');
        } else {
          setErrorMsg(msg);
        }
      }
    } catch {
      setErrorMsg('Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfficerTabClick = () => {
    navigate('/officer/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column'
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
          padding: '2rem 1.5rem'
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '460px',
            padding: '2.5rem',
            border: '1px solid var(--border-accent)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.38)'
              }}
            >
              <ShieldCheck size={26} color="#FFFFFF" />
            </div>

            <h1
              style={{
                fontSize: '1.7rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.25rem',
                letterSpacing: '-0.02em'
              }}
            >
              GovEaseAI
            </h1>
            <p
              style={{
                fontSize: '0.84rem',
                color: 'var(--text-muted)',
                margin: 0
              }}
            >
              Simplifying Government Services
            </p>
          </div>

          {/* Portal selector tabs */}
          <div className="role-selector-container" style={{ marginBottom: '2rem' }}>
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
          <div style={{ marginBottom: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}
            >
              Welcome Back
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
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

            {/* Email / Mobile */}
            <div style={fieldWrap}>
              <label htmlFor="login-identifier" className="form-label">
                Email or Mobile Number
              </label>
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
                placeholder="Enter email or mobile number"
                className="login-input"
                autoComplete="username"
                disabled={isLoading}
                aria-invalid={!!identifierError}
                aria-describedby={identifierError ? 'identifier-error' : undefined}
              />
              {identifierError && (
                <span
                  id="identifier-error"
                  style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.15rem' }}
                >
                  {identifierError}
                </span>
              )}
            </div>

            {/* Password */}
            <div style={fieldWrap}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.1rem'
                }}
              >
                <label htmlFor="login-password" className="form-label" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  id="forgot-password-link"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--accent-blue-light)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Forgot Password?
                </Link>
              </div>

              <div style={passwordWrap}>
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
                  className="login-input"
                  style={{ paddingRight: '3rem' }}
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
                  style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.15rem' }}
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
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                marginTop: '0.25rem',
                fontSize: '0.95rem',
                opacity: isLoading ? 0.75 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to Portal <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Government Portal Link */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}
          >
            Government official?{' '}
            <Link
              to="/officer/login"
              style={{
                color: 'var(--accent-blue)',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Sign in to Government Officer Portal
            </Link>
          </div>

          {/* Footer link to signup */}
          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)'
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: 'var(--accent-blue-light)',
                fontWeight: 600,
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
