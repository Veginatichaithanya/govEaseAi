import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { apiClient } from '../services/apiClient';

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
  alignItems: 'flex-start',
  gap: '0.65rem',
  padding: '0.85rem 1rem',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  color: '#34D399',
  fontSize: '0.84rem',
  lineHeight: '1.4'
};

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Wizard step: 1 = Request OTP, 2 = Verify OTP & Reset Password, 3 = Completed
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>('');

  // Resend Countdown
  const [resendCooldown, setResendCooldown] = useState(0);

  // Pre-fill from query params (e.g. email reset link: ?email=...&token=...&otp=...)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    const otpParam = searchParams.get('otp');

    if (emailParam) {
      setIdentifier(emailParam);
      if (tokenParam) {
        setResetToken(tokenParam);
        if (otpParam) {
          setOtp(otpParam);
        }
        setStep(2);
        setInfoMsg(`Reset credentials loaded for ${emailParam}. Please provide your new password.`);
      }
    }
  }, [searchParams]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Step 1: Request OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    if (!identifier.includes('@') || !identifier.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const res = await apiClient.post('/auth/forgot-password', {
        identifier: identifier.trim()
      });

      if (res.ok && res.data) {
        setMaskedEmail(res.data.maskedEmail || '');
        setInfoMsg(res.data.message || 'Verification code sent to your registered email.');
        setStep(2);
        setResendCooldown(60);
      } else {
        setErrorMsg(res.error || 'Failed to dispatch verification code. Please try again.');
      }
    } catch {
      setErrorMsg('Network error. Unable to connect to authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-check.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/reset-password', {
        identifier: identifier.trim(),
        otp: cleanOtp,
        newPassword,
        confirmPassword,
        resetToken: resetToken || undefined
      });

      if (res.ok) {
        setStep(3);
      } else {
        setErrorMsg(res.error || 'Password reset failed. The code may be invalid or expired.');
      }
    } catch {
      setErrorMsg('Network error. Unable to complete password update.');
    } finally {
      setIsLoading(false);
    }
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
          to="/login"
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
          <ArrowLeft size={16} /> Back to Sign In
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
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.38)'
              }}
            >
              {step === 3 ? (
                <CheckCircle2 size={28} color="#FFFFFF" />
              ) : (
                <KeyRound size={28} color="#FFFFFF" />
              )}
            </div>

            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
                letterSpacing: '-0.02em'
              }}
            >
              {step === 1 && 'Reset Password'}
              {step === 2 && 'Enter Security Code'}
              {step === 3 && 'Password Changed!'}
            </h1>
            <p
              style={{
                fontSize: '0.84rem',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: '1.45'
              }}
            >
              {step === 1 &&
                'Enter your registered email address to receive a 6-digit verification code.'}
              {step === 2 &&
                (maskedEmail
                  ? `We sent a 6-digit verification code to ${maskedEmail}.`
                  : 'Enter the 6-digit verification code and your new password.')}
              {step === 3 &&
                'Your account password has been updated securely. You can now sign in with your new credentials.'}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.8rem'
            }}
          >
            <div
              style={{
                height: '4px',
                flex: 1,
                borderRadius: '2px',
                background: step >= 1 ? 'var(--accent-blue)' : 'var(--border-subtle)',
                transition: 'background 0.3s'
              }}
            />
            <div
              style={{
                height: '4px',
                flex: 1,
                borderRadius: '2px',
                background: step >= 2 ? 'var(--accent-blue)' : 'var(--border-subtle)',
                transition: 'background 0.3s'
              }}
            />
            <div
              style={{
                height: '4px',
                flex: 1,
                borderRadius: '2px',
                background: step === 3 ? 'var(--status-success)' : 'var(--border-subtle)',
                transition: 'background 0.3s'
              }}
            />
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div style={{ ...errorBanner, marginBottom: '1.25rem' }} role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Banner */}
          {infoMsg && !errorMsg && (
            <div style={{ ...successBanner, marginBottom: '1.25rem' }} role="status">
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* ──────────────── STEP 1: REQUEST CODE ──────────────── */}
          {step === 1 && (
            <form
              onSubmit={handleRequestOtp}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
            >
              <div style={fieldWrap}>
                <label htmlFor="reset-identifier" className="form-label">
                  Registered Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-identifier"
                    type="email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="name@example.com"
                    className="login-input"
                    disabled={isLoading}
                    autoFocus
                    required
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Mail size={16} />
                  </div>
                </div>
              </div>

              <button
                id="request-reset-otp-btn"
                type="submit"
                disabled={isLoading || !identifier.trim()}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem',
                  marginTop: '0.5rem',
                  fontSize: '0.95rem',
                  opacity: isLoading || !identifier.trim() ? 0.7 : 1,
                  cursor: isLoading || !identifier.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Verification Code <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-accent-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)'
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                <span>Verification codes are valid for 15 minutes and delivered securely via Gmail SMTP.</span>
              </div>
            </form>
          )}

          {/* ──────────────── STEP 2: ENTER CODE & NEW PASSWORD ──────────────── */}
          {step === 2 && (
            <form
              onSubmit={handleResetPassword}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}
            >
              {/* Account details display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid var(--border-accent)',
                  fontSize: '0.82rem'
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Account:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-blue-light)' }}>
                  {maskedEmail || identifier}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textDecoration: 'underline'
                  }}
                >
                  Change
                </button>
              </div>

              {/* 6-Digit OTP */}
              <div style={fieldWrap}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <label htmlFor="reset-otp" className="form-label" style={{ marginBottom: 0 }}>
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    disabled={isLoading || resendCooldown > 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-blue-light)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <RefreshCw size={12} className={isLoading ? 'spin-icon' : ''} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
                <input
                  id="reset-otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    setErrorMsg(null);
                  }}
                  placeholder="123456"
                  className="login-input"
                  style={{
                    letterSpacing: '0.3em',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>

              {/* New Password */}
              <div style={fieldWrap}>
                <label htmlFor="new-password" className="form-label">
                  New Password
                </label>
                <div style={passwordWrap}>
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Minimum 8 characters"
                    className="login-input"
                    style={{ paddingRight: '3rem' }}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    style={eyeBtn}
                    onClick={() => setShowNewPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={fieldWrap}>
                <label htmlFor="confirm-password" className="form-label">
                  Confirm New Password
                </label>
                <div style={passwordWrap}>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Re-enter new password"
                    className="login-input"
                    style={{ paddingRight: '3rem' }}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    style={eyeBtn}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="reset-password-btn"
                type="submit"
                disabled={isLoading || otp.length < 6 || !newPassword}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem',
                  marginTop: '0.4rem',
                  fontSize: '0.95rem',
                  opacity: isLoading || otp.length < 6 || !newPassword ? 0.7 : 1,
                  cursor: isLoading || otp.length < 6 || !newPassword ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                    Updating Password...
                  </>
                ) : (
                  <>
                    Update Password <CheckCircle2 size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ──────────────── STEP 3: SUCCESS CONFIRMATION ──────────────── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34D399',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}
              >
                <strong>Security Notice:</strong> A confirmation alert has been delivered to your email. You can now use your new password to access the GovEaseAI citizen portal.
              </div>

              <button
                id="go-to-login-btn"
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem',
                  fontSize: '0.95rem'
                }}
              >
                Sign In Now <ArrowRight size={17} />
              </button>
            </div>
          )}

          {/* Back to sign in link */}
          {step !== 3 && (
            <div
              style={{
                marginTop: '1.75rem',
                textAlign: 'center',
                fontSize: '0.84rem',
                color: 'var(--text-secondary)'
              }}
            >
              Remembered your password?{' '}
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
          )}
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

export default ForgotPasswordPage;
