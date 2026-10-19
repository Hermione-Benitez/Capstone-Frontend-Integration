import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Package,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Globe,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Clock,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { STARS_API_URL } from '../config/env';
import './LoginPage.css';
import './ForgotPasswordPage.css';

type SystemKey = 'stars' | 'dms' | 'foms';

const SYSTEM_NAMES: Record<SystemKey, string> = {
  stars: 'STARS (Tracking & Audit System)',
  dms: 'DMS (Delivery Management System)',
  foms: 'FOMS (Financial Operations System)',
};

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const systemParam = (searchParams.get('system')?.toLowerCase() as SystemKey) || 'stars';
  const initialSystem: SystemKey = ['stars', 'dms', 'foms'].includes(systemParam) ? systemParam : 'stars';
  const initialId = searchParams.get('id') || searchParams.get('employeeId') || '';

  const [employeeNumber, setEmployeeNumber] = useState(initialId);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = employeeNumber.trim();
    const cleanEmail = email.trim();

    if (!cleanId) {
      setErrorMessage('Please enter your Employee ID / Username.');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered corporate email address.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. user@speedex.com).');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${STARS_API_URL}/api/Auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          employeeNumber: cleanId,
          email: cleanEmail,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || (data && data.isSuccess === false)) {
        const errorMsg = data?.message || 'Unable to locate an active employee record with these credentials.';
        setErrorMessage(errorMsg);
        return;
      }

      // Success
      setStep('sent');
      setCooldown(60); // 60s cooldown
    } catch (err) {
      console.error('Password recovery error:', err);
      setErrorMessage('Unable to connect to the authentication server. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setStep('form');
  };

  const maskEmail = (val: string) => {
    const parts = val.split('@');
    if (parts.length !== 2) return val;
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name.slice(0, 2)}••••${name.slice(-1)}` : `${name}••`;
    return `${maskedName}@${domain}`;
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
              onClick={() => navigate(`/login?system=${initialSystem}`)}
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
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="brand-title-badge">Identity Recovery</span>
                <span className="brand-sub-badge">CENTRAL SECURITY PORTAL</span>
              </div>
            </div>

            <div className="login-headline">
              <h2>
                Secure identity,<br />
                <span className="headline-accent">reliable recovery.</span>
              </h2>
              <p className="headline-body">
                Speedex enterprise password reset protocol. We verify identity across registered records
                before dispatching secure time-bound reset credentials.
              </p>
            </div>

            <div className="recovery-instruction-card">
              <h4>Recovery Instructions</h4>
              <ul>
                <li>Enter your registered Employee ID and associated corporate email.</li>
                <li>Check your inbox for a secure one-time password reset link.</li>
                <li>The reset link remains active for 15 minutes.</li>
                <li>Ensure your new password meets OWASP security standards (min 15 characters).</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="login-right">
          <div className="login-card">
            <button
              type="button"
              className="back-to-public-btn"
              onClick={() => navigate(`/login?system=${initialSystem}`)}
              aria-label="Back to Login"
            >
              <ArrowLeft size={14} />
              <span>Back to Central Login</span>
            </button>

            {step === 'form' ? (
              <>
                <div className="card-header">
                  <div className="system-recovery-tag">
                    <span>{SYSTEM_NAMES[initialSystem] || 'Speedex System'}</span>
                  </div>
                  <h1 className="card-title">Forgot Password?</h1>
                  <p className="card-subtitle">
                    Enter your Employee ID and corporate email to receive a secure password reset link.
                  </p>
                </div>

                {errorMessage && (
                  <div className="alert-banner danger">
                    <AlertTriangle size={18} />
                    <div>{errorMessage}</div>
                  </div>
                )}

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                  {/* Employee ID */}
                  <div className="field-group">
                    <label htmlFor="recovery-id" className="field-label">
                      Employee ID / Username <span style={{ color: '#E31A1A' }}>*</span>
                    </label>
                    <div className="field-wrapper">
                      <span className="field-icon">
                        <User size={16} />
                      </span>
                      <input
                        id="recovery-id"
                        type="text"
                        className="field-input"
                        placeholder="e.g. EMP-001 or MGR001"
                        value={employeeNumber}
                        onChange={(e) => setEmployeeNumber(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  {/* Corporate Email */}
                  <div className="field-group">
                    <label htmlFor="recovery-email" className="field-label">
                      Registered Email Address <span style={{ color: '#E31A1A' }}>*</span>
                    </label>
                    <div className="field-wrapper">
                      <span className="field-icon">
                        <Mail size={16} />
                      </span>
                      <input
                        id="recovery-email"
                        type="email"
                        className="field-input"
                        placeholder="e.g. employee@speedex.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting}
                    style={{ marginTop: '12px' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="spinner" />
                        <span>Verifying &amp; Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* SENT CONFIRMATION STEP */
              <div className="recovery-sent-wrapper">
                <div className="recovery-success-icon-box">
                  <CheckCircle size={44} />
                </div>
                <h2 className="recovery-sent-title">Check Your Email</h2>
                <p className="recovery-sent-desc">
                  We've sent a password reset link to:
                  <br />
                  <strong className="recovery-masked-email">{maskEmail(email)}</strong>
                </p>
                <p className="recovery-sent-subtext">
                  Please click the link in your email to choose a new password. The link will expire in 15 minutes.
                  If you don't see it, be sure to check your spam or junk folder.
                </p>

                <div className="recovery-actions">
                  <button
                    type="button"
                    className="resend-btn"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                  >
                    {cooldown > 0 ? (
                      <>
                        <Clock size={16} />
                        <span>Resend available in {cooldown}s</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw size={16} />
                        <span>Resend Reset Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="submit-btn"
                    onClick={() => navigate(`/login?system=${initialSystem}&id=${encodeURIComponent(employeeNumber)}`)}
                  >
                    <span>Return to Login</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            <footer className="login-footer" style={{ marginTop: '32px' }}>
              <p className="login-footer-copy">
                Need administrative assistance? Contact the{' '}
                <a href="mailto:admin@speedex.com" style={{ color: '#0f1936', fontWeight: 600 }}>
                  Speedex Security Desk
                </a>
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
