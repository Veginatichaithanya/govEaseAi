import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import {
  DEPARTMENT_OPTIONS,
  GOVERNMENT_DEPARTMENTS
} from '../../config/governmentDepartments';
import { officerAuth } from '../../mock/auth';
import ThemeToggle from '../../components/ThemeToggle';

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

  // Field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
      return 'Unable to connect to the Government Officer Portal.';
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
    setErrorMessage(null);

    try {
      // Authenticate against PostgreSQL backend (POST /api/auth/officer/login)
      const result = await officerAuth.loginOfficerAsync(selectedDeptId, email.trim(), password);

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
      setErrorMessage('Unable to connect to the Government Officer Portal.');
    } finally {
      setIsLoading(false);
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

          <span style={{ color: 'var(--border-subtle)', fontSize: '0.9rem' }}>|</span>

          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
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
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}
          >
            {/* Office / Department Dropdown */}
            <div>
              <label
                htmlFor="department-select"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}
              >
                <Building2 size={16} color="var(--accent-blue)" />
                Office / Department
              </label>

              <div style={{ position: 'relative' }}>
                <select
                  id="department-select"
                  value={selectedDeptId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="login-input"
                  style={{
                    width: '100%',
                    paddingRight: '2.5rem',
                    appearance: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>

                <div
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--text-muted)'
                  }}
                >
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* Department service badge */}
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981'
                  }}
                />
                Active Department: <strong>{activeDept.departmentName}</strong>
              </div>
            </div>

            {/* Email Field (auto-populated upon department selection) */}
            <div>
              <label
                htmlFor="officer-email"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}
              >
                <Mail size={15} color="var(--text-secondary)" />
                Email
              </label>
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
                autoComplete="username"
                required
                disabled={isLoading}
                aria-invalid={!!emailError}
              />
              {emailError && (
                <span style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.25rem', display: 'block' }}>
                  {emailError}
                </span>
              )}
            </div>

            {/* Password Field (auto-populated upon department selection) */}
            <div>
              <label
                htmlFor="officer-password"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}
              >
                <Lock size={15} color="var(--text-secondary)" />
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="officer-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setErrorMessage(null);
                  }}
                  placeholder="Enter password"
                  className="login-input"
                  style={{ paddingRight: '3rem' }}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
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
                  lineHeight: '1.4'
                }}
                role="alert"
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="officer-signin-btn"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
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
                  Sign In <ArrowRight size={17} />
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
