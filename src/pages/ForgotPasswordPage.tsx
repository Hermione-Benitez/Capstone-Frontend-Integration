import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { STARS_API_URL } from '../config/env';
import './LoginPage.css';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
      setErrorMessage('Please enter your Employee ID.');
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
      console.error('Forgot password request error:', err);
      setErrorMessage('Unable to reach the server. Please verify your connection.');
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
          </nav>
        </div>
      </header>

      {/* ── UNIFIED 2-COLUMN FLOATING CARD (Starkfest Inspo) ── */}
      <main className="login-page-main">
        <div className="login-unified-card">
          {/* LEFT COLUMN: FORM */}
          <div className="login-card-form">
            <button
              type="button"
              className="forgot-back-link"
              onClick={() => navigate('/login')}
              aria-label="Back to Login"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>

            {step === 'form' ? (
              <>
                <div className="card-header">
                  <h1 className="card-title">Forgot Password?</h1>
                  <p className="card-subtitle">
                    Enter your Employee ID and corporate email to receive a password reset link.
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
                      Employee ID <span style={{ color: '#E31A1A' }}>*</span>
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
                        placeholder="e.g. employee@myspeedex.net"
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
                    style={{ marginTop: '10px' }}
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
                  <CheckCircle size={40} />
                </div>
                <h2 className="recovery-sent-title">Check Your Email</h2>
                <p className="recovery-sent-desc">
                  We've sent a password reset link to:
                  <br />
                  <strong className="recovery-masked-email">{maskEmail(email)}</strong>
                </p>
                <p className="recovery-sent-subtext">
                  Please click the link in your email to choose a new password. The link will expire in 15 minutes.
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
                    onClick={() => navigate('/login')}
                  >
                    <span>Return to Login</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            <footer className="login-footer" style={{ marginTop: '20px' }}>
              <p className="login-footer-copy">
                Need administrative assistance? Contact{' '}
                <a href="mailto:admin@myspeedex.net" style={{ color: '#00776D', fontWeight: 600 }}>
                  admin@myspeedex.net
                </a>
              </p>
            </footer>
          </div>

          {/* RIGHT COLUMN: #ROADTO30 WAREHOUSE TEAM ART */}
          <div className="login-card-visual" aria-hidden="true">
            <img
              src="/warehouse-team.png"
              alt="Speedex Warehouse Logistics Team"
              className="login-visual-img"
            />
            {/* Elegant organic convex curve divider (Starkfest Inspo) */}
            <svg
              className="login-visual-curve"
              viewBox="0 0 40 500"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0,0 Q40,250 0,500 L0,0 Z" fill="#ffffff" />
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
