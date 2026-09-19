import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Phone,
  Lock
} from 'lucide-react';

import { authService } from '../mock/auth';
import ThemeToggle from '../components/ThemeToggle';

/* ─────────────────────────────────────────────────
   Field-level validation helpers
───────────────────────────────────────────────── */
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address.';
  return '';
}

function validateMobile(mobile: string): string {
  if (!mobile.trim()) return 'Mobile number is required.';
  const digits = mobile.trim().replace(/\s/g, '');
  if (!INDIAN_MOBILE_REGEX.test(digits)) return 'Enter a valid 10-digit Indian mobile number.';
  return '';
}

function validatePassword(password: string): string {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return '';
}

/* ─────────────────────────────────────────────────
   Inline style helpers
───────────────────────────────────────────────── */
const fieldGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
};

const fieldError: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#F87171',
  marginTop: '0.1rem'
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

/* ─────────────────────────────────────────────────
   InputField component for DRY code
───────────────────────────────────────────────── */
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  inputStyle?: React.CSSProperties;
}

const InputField: React.FC<InputFieldProps> = ({
  id, label, type = 'text', value, onChange, placeholder, error, disabled, autoComplete, icon, rightElement, inputStyle
}) => (
  <div style={fieldGroup}>
    <label htmlFor={id} className="form-label">
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      {icon && (
        <span
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            pointerEvents: 'none'
          }}
        >
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="login-input"
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={!!error}
        style={{
          paddingLeft: icon ? '2.6rem' : undefined,
          paddingRight: rightElement ? '3rem' : undefined,
          ...inputStyle
        }}
      />
      {rightElement}
    </div>
    {error && <span style={fieldError}>{error}</span>}
  </div>
);

/* ─────────────────────────────────────────────────
   SignupPage
───────────────────────────────────────────────── */
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Field errors
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  const clearApiError = () => setApiError(null);

  const validateForm = (): boolean => {
    const newErrors = {
      fullName: fullName.trim() ? '' : 'Full name is required.',
      email: validateEmail(email),
      mobile: validateMobile(mobile),
      password: validatePassword(password),
      confirmPassword:
        !confirmPassword
          ? 'Please confirm your password.'
          : confirmPassword !== password
          ? 'Passwords do not match.'
          : ''
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isLoading) return;

    setIsLoading(true);
    setApiError(null);

    const result = await authService.signupAsync(
      fullName.trim(),
      email.trim().toLowerCase(),
      mobile.trim(),
      password,
      confirmPassword
    );

    setIsLoading(false);

    if (result.success) {
      setSuccessState(true);
      // Redirect to login after short delay
      setTimeout(() => navigate('/login'), 2500);
    } else {
      setApiError(result.error || 'Signup failed. Please try again.');
    }
  };

  /* ── Success State ── */
  if (successState) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <div
          className="glass-panel"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}
          >
            <CheckCircle2 size={30} color="#10B981" />
          </div>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Account Created Successfully
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your citizen account has been created. Please sign in to continue.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Redirecting to Sign In…
          </p>
        </div>
      </div>
    );
  }

  /* ── Main Signup Form ── */
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

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '2rem 1.5rem 3rem'
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '540px',
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
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.3rem',
                letterSpacing: '-0.02em'
              }}
            >
              Create Your Citizen Account
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
              Register once to access government services through GovEaseAI.
            </p>
          </div>

          {/* ── Form ── */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}
          >
            {/* ── Desktop 2-col: Full Name + Email ── */}
            <div
              className="signup-row"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}
            >
              {/* Full Name */}
              <InputField
                id="signup-fullname"
                label="Full Name"
                value={fullName}
                onChange={(v) => {
                  setFullName(v);
                  if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' }));
                  clearApiError();
                }}
                placeholder="e.g. Ravi Kumar"
                error={errors.fullName}
                disabled={isLoading}
                autoComplete="name"
                icon={<User size={16} />}
              />

              {/* Email */}
              <InputField
                id="signup-email"
                label="Email"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                  clearApiError();
                }}
                placeholder="you@example.com"
                error={errors.email}
                disabled={isLoading}
                autoComplete="email"
                icon={<Mail size={16} />}
              />
            </div>

            {/* Mobile */}
            <InputField
              id="signup-mobile"
              label="Mobile Number"
              type="tel"
              value={mobile}
              onChange={(v) => {
                setMobile(v);
                if (errors.mobile) setErrors((p) => ({ ...p, mobile: '' }));
                clearApiError();
              }}
              placeholder="10-digit mobile number"
              error={errors.mobile}
              disabled={isLoading}
              autoComplete="tel"
              icon={<Phone size={16} />}
            />

            {/* ── Desktop 2-col: Password + Confirm ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}
            >
              {/* Password */}
              <div style={fieldGroup}>
                <label htmlFor="signup-password" className="form-label">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      pointerEvents: 'none'
                    }}
                  >
                    <Lock size={16} />
                  </span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((p) => ({ ...p, password: '' }));
                      clearApiError();
                    }}
                    placeholder="Min. 8 characters"
                    className="login-input"
                    autoComplete="new-password"
                    disabled={isLoading}
                    style={{ paddingLeft: '2.6rem', paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    style={eyeBtn}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <span style={fieldError}>{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div style={fieldGroup}>
                <label htmlFor="signup-confirm" className="form-label">
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      pointerEvents: 'none'
                    }}
                  >
                    <Lock size={16} />
                  </span>
                  <input
                    id="signup-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }));
                      clearApiError();
                    }}
                    placeholder="Re-enter password"
                    className="login-input"
                    autoComplete="new-password"
                    disabled={isLoading}
                    style={{ paddingLeft: '2.6rem', paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    style={eyeBtn}
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span style={fieldError}>{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* API Error Banner */}
            {apiError && (
              <div
                role="alert"
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
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  {apiError}{' '}
                  {apiError.includes('email') && (
                    <Link to="/login" style={{ color: '#FCA5A5', fontWeight: 600 }}>
                      Go to Sign In
                    </Link>
                  )}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.9rem',
                marginTop: '0.25rem',
                fontSize: '0.95rem',
                opacity: isLoading ? 0.75 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Citizen Account <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)'
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--accent-blue-light)',
                fontWeight: 600,
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Sign In
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

export default SignupPage;
