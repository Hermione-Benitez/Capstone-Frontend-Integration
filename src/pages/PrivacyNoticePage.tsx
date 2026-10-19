import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { getStoredAuthSession, redirectToSubsystem } from '../utils/auth';
import { STARS_API_URL } from '../config/env';
import './LoginPage.css';
import './OnboardingPage.css';

export default function PrivacyNoticePage() {
  const [searchParams] = useSearchParams();
  const system = searchParams.get('system') || 'stars';
  const session = getStoredAuthSession();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAgreed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = session?.authToken;
      if (system === 'stars' && token) {
        await fetch(`${STARS_API_URL}/api/Auth/accept-terms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ termsVersion: 'v1.0' }),
        }).catch(() => {/* best-effort */});
      }

      // Launch into subsystem dashboard
      redirectToSubsystem(system, session);
    } catch (err) {
      console.error('Accept terms error:', err);
      // Still proceed into subsystem since user checked the box
      redirectToSubsystem(system, session);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-root">
      <div className="onboarding-card" style={{ maxWidth: 640 }}>
        <header className="onboarding-header">
          <div className="brand-badge" style={{ margin: '0 auto 1rem auto' }}>
            <ShieldCheck size={14} />
            Data Privacy Compliance
          </div>
          <h1 className="brand-title">Speedex Privacy Agreement</h1>
          <p className="brand-subtitle">
            Republic Act No. 10173 (Data Privacy Act of 2012)
          </p>
        </header>

        {error && (
          <div className="alert-banner danger">
            <div>{error}</div>
          </div>
        )}

        <div
          style={{
            maxHeight: 280,
            overflowY: 'auto',
            padding: '1rem',
            background: 'rgba(31, 41, 55, 0.6)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.825rem',
            lineHeight: 1.6,
            color: '#d1d5db',
            marginBottom: '1.5rem',
          }}
        >
          <h4 style={{ color: '#ffffff', marginTop: 0 }}>1. Collection and Processing of Staff Data</h4>
          <p>
            Speedex Courier &amp; Forwarder, Inc. collects and processes personal information, including your full name, employee identification, contact details, role, access logs, and geolocation tracking (for couriers/drivers) solely for legitimate operational routing, task assignment, auditing, and corporate accountability.
          </p>

          <h4 style={{ color: '#ffffff' }}>2. Security &amp; Access Controls</h4>
          <p>
            All collected personal and operational data is secured using industry-standard cryptography, role-based access control, sliding-window rate limiting, and session inactivity monitoring. Access is restricted exclusively to authorized personnel in accordance with their job duties.
          </p>

          <h4 style={{ color: '#ffffff' }}>3. Data Subject Rights</h4>
          <p>
            Pursuant to Republic Act No. 10173, you retain the right to be informed, to access, to object, to rectify, to erase, and to lodge a complaint regarding the processing of your personal information through Speedex Data Protection Office.
          </p>

          <h4 style={{ color: '#ffffff' }}>4. Confidentiality Commitment</h4>
          <p>
            As an employee or authorized agent accessing Speedex Systems (STARS, DMS, FOMS), you commit to maintaining strict confidentiality of customer waybill records, financial balances, and consignment details. Unauthorized disclosure constitutes a breach of Philippine law and company policy.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#e5e7eb',
              lineHeight: 1.4,
            }}
          >
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              style={{
                marginTop: '0.2rem',
                width: 18,
                height: 18,
                accentColor: '#f59e0b',
                cursor: 'pointer',
              }}
              required
            />
            <span>
              I have read, understood, and voluntarily agree to the Speedex Data Privacy Agreement and terms of access in compliance with Republic Act No. 10173.
            </span>
          </label>

          <button
            type="submit"
            className="submit-btn"
            disabled={!hasAgreed || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>Launching System...</span>
              </>
            ) : (
              <>
                <span>I Agree &amp; Launch {system.toUpperCase()}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
