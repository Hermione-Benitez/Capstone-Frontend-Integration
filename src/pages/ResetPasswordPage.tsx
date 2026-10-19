import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  XCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Globe,
  KeyRound,
} from 'lucide-react';
import { STARS_API_URL } from '../config/env';
import './LoginPage.css';
import './ResetPasswordPage.css';

/* ── OWASP password rules ── */
const PW_RULES = {
  minLength: 15,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};

const getPwChecks = (pw: string) => ({
  length: pw.length >= PW_RULES.minLength,
  uppercase: PW_RULES.hasUppercase.test(pw),
  lowercase: PW_RULES.hasLowercase.test(pw),
  number: PW_RULES.hasNumber.test(pw),
  special: PW_RULES.hasSpecial.test(pw),
});

const isPasswordValid = (pw: string) => Object.values(getPwChecks(pw)).every(Boolean);

const getStrength = (pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
  if (!pw) return { level: 0, label: '', color: '' };
  const passed = Object.values(getPwChecks(pw)).filter(Boolean).length;
  if (passed <= 2) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (passed <= 4) return { level: 2, label: 'Fair', color: '#f59e0b' };
  return { level: 3, label: 'Strong', color: '#10b981' };
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = (searchParams.get('token') ?? '').trim();
  const tokenMissing = !token;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [touchedNew, setTouchedNew] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const checks = getPwChecks(newPassword);
  const strength = getStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Auto redirect on success
  useEffect(() => {
    if (!isDone) return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isDone, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedNew(true);
    setTouchedConfirm(true);
    setErrorMessage(null);

    if (tokenMissing) {
      setErrorMessage('Reset token is missing or malformed. Please request a new link.');
      return;
    }
    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setErrorMessage('Password must meet all OWASP requirements below (min 15 characters).');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${STARS_API_URL}/api/Auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || (data && data.isSuccess === false)) {
        const errorMsg = data?.message || 'Password reset failed. The link may have expired or already been used.';
        setErrorMessage(errorMsg);
        return;
      }

      setIsDone(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setErrorMessage('Unable to reach the server. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* ── TOP NAV BAR ── */}
      <header className="speedex-system-header">
        <div className="speedex-header-inner">
          <a
            href="/"
            className="speedex-header-brand"
            title="Speedex Public Portal"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <img src="/logo.png" alt="Speedex Logo" className="speedex-nav-logo" />
            <div className="speedex-header-text">
              <span className="brand-name">Speedex</span>
              <span className="brand-sub">COURIER &amp; FORWARDER, INC.</span>
            </div>
          </a>
          <nav className="speedex-nav-links" aria-label="Speedex System Navigation">
            <button
              type="button"
              className="speedex-nav-link speedex-nav-link-public"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>
            <a
              href="/"
              className="speedex-nav-link"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              <Globe size={14} />
              <span>Public Website</span>
            </a>
          </nav>
        </div>
      </header>

      {/* ── 2-COLUMN SPLIT LAYOUT ── */}
      <div className="login-page-split">
        {/* LEFT PANEL */}
        <aside className="login-left">
          <div className="login-decorative-circle circle-1" />
          <div className="login-decorative-circle circle-2" />
          <div className="login-left-content">
            <div className="login-brand-badge">
              <div className="brand-icon-box">
                <KeyRound size={22} />
              </div>
              <div>
                <span className="brand-title-badge">Credential Vault</span>
                <span className="brand-sub-badge">OWASP COMPLIANT RESET</span>
              </div>
            </div>

            <div className="login-headline">
              <h2>
                Enterprise security,<br />
                <span className="headline-accent">zero compromises.</span>
              </h2>
              <p className="headline-body">
                Speedex enforces modern cryptographic guidelines and high-entropy passwords to safeguard our
                logistics and dispatch systems against automated attacks.
              </p>
            </div>

            <div className="pw-guideline-box">
              <h4>Security Standard Requirements</h4>
              <p>
                In compliance with Speedex Enterprise Security Policies, passwords must be at least 15 characters
                and contain a mix of character categories.
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="login-right">
          <div className="login-card">
            <button
              type="button"
              className="back-to-public-btn"
              onClick={() => navigate('/login')}
              aria-label="Back to Login"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>

            {tokenMissing ? (
              /* TOKEN MISSING OR INVALID STATE */
              <div className="reset-token-missing-box">
                <div className="token-missing-icon">
                  <AlertTriangle size={42} />
                </div>
                <h2>Invalid or Missing Reset Link</h2>
                <p>
                  This password reset link is invalid, incomplete, or has expired. For your security, reset links
                  can only be used once and expire 15 minutes after issuance.
                </p>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => navigate('/forgot-password')}
                  style={{ marginTop: '20px' }}
                >
                  <span>Request a New Reset Link</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : isDone ? (
              /* SUCCESS SCREEN */
              <div className="reset-success-box">
                <div className="reset-success-icon">
                  <CheckCircle size={44} />
                </div>
                <h2>Password Reset Successfully</h2>
                <p>
                  Your credentials have been securely updated. You can now use your new password across Speedex
                  services.
                </p>
                <div className="redirect-notice">
                  Redirecting to Central One-Login in <strong>{redirectCountdown}</strong> seconds...
                </div>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => navigate('/login')}
                >
                  <span>Sign In Now</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              /* RESET FORM */
              <>
                <div className="card-header">
                  <span className="header-badge">CREDENTIAL RECOVERY</span>
                  <h1 className="card-title">Set New Password</h1>
                  <p className="card-subtitle">
                    Enter your new password below. It must satisfy all security requirements.
                  </p>
                </div>

                {errorMessage && (
                  <div className="alert-banner danger">
                    <AlertTriangle size={18} />
                    <div>{errorMessage}</div>
                  </div>
                )}

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                  {/* New Password */}
                  <div className="field-group">
                    <label htmlFor="new-password" className="field-label">
                      New Password <span style={{ color: '#E31A1A' }}>*</span>
                    </label>
                    <div className="field-wrapper">
                      <span className="field-icon">
                        <Lock size={16} />
                      </span>
                      <input
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        className="field-input"
                        placeholder="At least 15 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onBlur={() => setTouchedNew(true)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="toggle-pw"
                        onClick={() => setShowNew(!showNew)}
                        tabIndex={-1}
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="strength-meter-container">
                        <div className="strength-bar-track">
                          <div
                            className="strength-bar-fill"
                            style={{
                              width: `${(strength.level / 3) * 100}%`,
                              backgroundColor: strength.color,
                            }}
                          />
                        </div>
                        <span className="strength-label" style={{ color: strength.color }}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="field-group">
                    <label htmlFor="confirm-password" className="field-label">
                      Confirm New Password <span style={{ color: '#E31A1A' }}>*</span>
                    </label>
                    <div className="field-wrapper">
                      <span className="field-icon">
                        <ShieldCheck size={16} />
                      </span>
                      <input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        className="field-input"
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => setTouchedConfirm(true)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="toggle-pw"
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex={-1}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {touchedConfirm && confirmPassword && !passwordsMatch && (
                      <span className="field-inline-error">Passwords do not match.</span>
                    )}
                  </div>

                  {/* Live OWASP Validation Checklist */}
                  <div className="pw-checklist-card">
                    <span className="checklist-title">Password Requirements:</span>
                    <ul className="checklist-items">
                      <li className={checks.length ? 'met' : 'unmet'}>
                        {checks.length ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>At least 15 characters long</span>
                      </li>
                      <li className={checks.uppercase ? 'met' : 'unmet'}>
                        {checks.uppercase ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>At least 1 uppercase letter (A-Z)</span>
                      </li>
                      <li className={checks.lowercase ? 'met' : 'unmet'}>
                        {checks.lowercase ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>At least 1 lowercase letter (a-z)</span>
                      </li>
                      <li className={checks.number ? 'met' : 'unmet'}>
                        {checks.number ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>At least 1 number (0-9)</span>
                      </li>
                      <li className={checks.special ? 'met' : 'unmet'}>
                        {checks.special ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>At least 1 special character (!@#$%^&amp;*...)</span>
                      </li>
                      <li className={passwordsMatch ? 'met' : 'unmet'}>
                        {passwordsMatch ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>Passwords match</span>
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting || !isPasswordValid(newPassword) || !passwordsMatch}
                    style={{ marginTop: '16px' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="spinner" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            <footer className="login-footer" style={{ marginTop: '32px' }}>
              <div className="security-note">
                <Lock size={13} />
                <span>Protected by Speedex PBKDF2 Encrypted Password Storage</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
