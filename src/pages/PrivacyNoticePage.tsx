import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  Check,
  Globe,
  Lock,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { getStoredAuthSession, redirectToSubsystem } from '../utils/auth';
import { STARS_API_URL } from '../config/env';
import './LoginPage.css';
import './OnboardingPage.css';

export default function PrivacyNoticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const system = (searchParams.get('system') || 'stars').toLowerCase();
  const session = getStoredAuthSession();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const systemName =
    system === 'dms'
      ? 'DMS'
      : system === 'foms'
      ? 'FOMS'
      : 'STARS';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAgreed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = session?.authToken;
      if (token) {
        await fetch(`${STARS_API_URL}/api/Auth/accept-terms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ termsVersion: 'v1.0' }),
        }).catch(() => {
          /* best-effort fallback */
        });
      }

      // Launch into target subsystem dashboard
      redirectToSubsystem(system, session);
    } catch (err) {
      console.error('Accept terms error:', err);
      // Still proceed into subsystem since user signed off
      redirectToSubsystem(system, session);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-container onboarding-view-container">
      {/* ── TOP NAV BAR ── */}
      <header className="speedex-system-header">
        <div className="speedex-header-inner">
          <a
            href="/"
            className="speedex-header-brand"
            title="Speedex Portal"
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
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="brand-title-badge">Employee Gateway</span>
                <span className="brand-sub-badge">COMPLIANCE &amp; GOVERNANCE</span>
              </div>
            </div>

            <div className="login-headline">
              <h2>
                Data Privacy &amp; Governance,<br />
                <span className="headline-accent">protecting trust across every consignment.</span>
              </h2>
              <p className="headline-body">
                Speedex Courier &amp; Forwarder, Inc. strictly complies with Republic Act No. 10173
                (Data Privacy Act of 2012). All staff accounts across STARS, DMS, and FOMS must confirm compliance
                before accessing operational systems.
              </p>
            </div>

            {/* Step Roadmap */}
            <div className="onboarding-steps-aside">
              <div className="aside-step-item done">
                <div className="aside-step-bullet">
                  <Check size={14} />
                </div>
                <div className="aside-step-text">
                  <strong>Staff Profile Setup</strong>
                  <span>Personal details and mobile contact verified.</span>
                </div>
              </div>

              <div className="aside-step-item done">
                <div className="aside-step-bullet">
                  <Check size={14} />
                </div>
                <div className="aside-step-text">
                  <strong>Security Password</strong>
                  <span>OWASP-compliant high entropy password established.</span>
                </div>
              </div>

              <div className="aside-step-item current">
                <div className="aside-step-bullet">3</div>
                <div className="aside-step-text">
                  <strong>Privacy &amp; Terms</strong>
                  <span>Republic Act No. 10173 statutory compliance agreement.</span>
                </div>
              </div>
            </div>

            <div className="onboarding-compliance-box">
              <div className="compliance-icon-row">
                <FileText size={18} className="compliance-icon" />
                <span>National Privacy Commission (NPC) Aligned</span>
              </div>
              <p>
                Staff accounts, customer consignments, waybills, and dispatch telematics are managed under strict
                confidentiality, ISO/IEC 27001 data protection principles, and secure access audits.
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="login-right">
          <div className="login-card onboarding-card-enhanced privacy-card-enhanced">
            <button
              type="button"
              className="back-to-public-btn"
              onClick={() => navigate('/login')}
              aria-label="Back to Login"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>

            {/* Stepper Progress Indicator */}
            <div className="onboarding-stepper" role="navigation" aria-label="Onboarding Progress">
              <div className="stepper-step completed">
                <div className="stepper-circle">
                  <Check size={14} />
                </div>
                <div className="stepper-labels">
                  <span className="step-tag">Step 1</span>
                  <span className="step-name">Profile Details</span>
                </div>
              </div>

              <div className="stepper-connector">
                <div className="stepper-connector-line filled" />
              </div>

              <div className="stepper-step completed">
                <div className="stepper-circle">
                  <Check size={14} />
                </div>
                <div className="stepper-labels">
                  <span className="step-tag">Step 2</span>
                  <span className="step-name">New Password</span>
                </div>
              </div>

              <div className="stepper-connector">
                <div className="stepper-connector-line filled" />
              </div>

              <div className="stepper-step active">
                <div className="stepper-circle">3</div>
                <div className="stepper-labels">
                  <span className="step-tag">Step 3</span>
                  <span className="step-name">Privacy Agreement</span>
                </div>
              </div>
            </div>

            {/* Card Header */}
            <div className="card-header">
              <span className="header-badge">STATUTORY DATA GOVERNANCE</span>
              <h1 className="card-title">Speedex Privacy Agreement</h1>
              <p className="card-subtitle">
                Republic Act No. 10173 (Data Privacy Act of 2012) Corporate Policy Sign-Off
              </p>
            </div>

            {/* Document Reference Bar */}
            <div className="privacy-meta-bar">
              <span className="privacy-meta-pill">
                <FileText size={13} />
                <span>POLICY REF: SPX-DPA-2026-V1</span>
              </span>
              <span className="privacy-meta-badge">CONFIDENTIAL / STAFF USE</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert-banner danger">
                <div>{error}</div>
              </div>
            )}

            {/* Scrollable Privacy Terms Document */}
            <div className="privacy-document-scrollbox" tabIndex={0} aria-label="Privacy Agreement Document Content">
              <div className="privacy-section">
                <h4 className="privacy-section-header">1. Collection and Processing of Staff Data</h4>
                <p>
                  Speedex Courier &amp; Forwarder, Inc. collects and processes personal information, including your
                  full name, employee identification number, mobile contact number, company email, system access logs,
                  and GPS geolocation tracking (for riders, drivers, and field operations staff) exclusively for legitimate
                  logistics routing, dispatch assignment, payroll verification, system security audits, and statutory
                  compliance.
                </p>
              </div>

              <div className="privacy-section">
                <h4 className="privacy-section-header">2. Security &amp; Access Controls</h4>
                <p>
                  All collected personal, operational, and customer consignment data is protected using enterprise-grade
                  cryptography, Role-Based Access Control (RBAC), sliding-window rate limiting, and automated session
                  inactivity timeouts. Access to Speedex enterprise subsystems (STARS, DMS, FOMS) is restricted strictly
                  to authorized duties assigned by your department manager.
                </p>
              </div>

              <div className="privacy-section">
                <h4 className="privacy-section-header">3. Data Subject Rights (RA 10173)</h4>
                <p>
                  Pursuant to Republic Act No. 10173, you retain the statutory right to be informed, to access, to object,
                  to rectify, to suspend or withdraw your personal data, and to lodge an official complaint regarding the
                  processing of your personal information through the Speedex Data Protection Office (DPO).
                </p>
              </div>

              <div className="privacy-section">
                <h4 className="privacy-section-header">4. Confidentiality &amp; Non-Disclosure Commitment</h4>
                <p>
                  As an employee or authorized contractor accessing Speedex systems, you commit to maintaining strict
                  confidentiality regarding customer waybill manifests, recipient contact details, financial records,
                  and parcel valuations. Any unauthorized copying, disclosure, or export of company or client data
                  constitutes a severe breach of Philippine law, company regulations, and may lead to immediate termination
                  and civil/criminal prosecution.
                </p>
              </div>

              <div className="privacy-section">
                <h4 className="privacy-section-header">5. Acceptance &amp; Authorized Subsystem Operations</h4>
                <p>
                  By completing this acknowledgment, you confirm that you have read and agreed to adhere to Speedex
                  Operating Guidelines and Data Protection Standards throughout your active access to{' '}
                  <strong>{systemName}</strong> and affiliated enterprise logistics tools.
                </p>
              </div>
            </div>

            {/* Form & Acceptance Checkbox */}
            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <label
                className={`privacy-checkbox-card ${hasAgreed ? 'is-agreed' : ''}`}
                htmlFor="privacy-agreement-checkbox"
              >
                <input
                  id="privacy-agreement-checkbox"
                  type="checkbox"
                  className="privacy-checkbox-input"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  required
                />
                <div className="privacy-custom-checkbox" aria-hidden="true">
                  {hasAgreed && <Check size={15} strokeWidth={3} />}
                </div>
                <div className="privacy-checkbox-text">
                  <strong>I have read, understood, and voluntarily agree</strong> to the Speedex Data Privacy Agreement
                  and terms of access in compliance with Republic Act No. 10173 (Data Privacy Act of 2012).
                </div>
              </label>

              <button
                type="submit"
                className="submit-btn onboarding-submit-btn privacy-submit-btn"
                disabled={!hasAgreed || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Authorizing &amp; Launching {systemName}...</span>
                  </>
                ) : (
                  <>
                    <span>I Agree &amp; Launch {systemName}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
