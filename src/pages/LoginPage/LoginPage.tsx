import React, { useState } from 'react';
import { getStarsLoginUrl } from '../../utils/auth';
import './LoginPage.css';



const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const starsUrl = getStarsLoginUrl('/portal');

  return (
    <div className="lp-root">
      {/* ── Left Panel — Branding ───────────────────────────── */}
      <aside className="lp-left" aria-label="Speedex portal branding">
        <div className="lp-circle lp-circle-1" aria-hidden="true" />
        <div className="lp-circle lp-circle-2" aria-hidden="true" />
        <div className="lp-circle lp-circle-3" aria-hidden="true" />

        <div className="lp-left-content">
          {/* Logo only */}
          <div className="lp-brand">
            <img src="/logo.png" alt="Speedex Logo" className="lp-logo" />
          </div>

          <div className="lp-hero-copy">
            <h1 className="lp-hero-title">
              Fast deliveries,<br />smarter logistics.
            </h1>
            <p className="lp-hero-desc">
              Manage shipments, monitor deliveries, and access your operational dashboard in one place.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right Panel — Sign In ───────────────────────────── */}
      <main className="lp-right" aria-label="Sign in">
        <div className="lp-form-wrap">
          <div className="lp-card">
            {/* Card header */}
            <div className="lp-card-head">
              <span className="lp-card-kicker">
                <i className="ti ti-lock" aria-hidden="true" />
                Secure Access
              </span>
              <h2 className="lp-card-title">Welcome!</h2>
              <p className="lp-card-sub">Sign in to continue to your workspace.</p>
            </div>

            <hr className="lp-divider" />

            {/* Form — submits to STARS auth */}
            <form
              className="lp-form"
              onSubmit={(e) => { e.preventDefault(); window.location.href = starsUrl; }}
              noValidate
            >
              {/* Employee ID */}
              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-emp-id">
                  EMPLOYEE ID <span aria-hidden="true" className="lp-required">*</span>
                </label>
                <div className="lp-input-wrap">
                  <i className="ti ti-user lp-input-icon" aria-hidden="true" />
                  <input
                    id="lp-emp-id"
                    type="text"
                    className="lp-input"
                    placeholder="Enter your employee ID"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-password">
                  PASSWORD <span aria-hidden="true" className="lp-required">*</span>
                </label>
                <div className="lp-input-wrap">
                  <i className="ti ti-lock lp-input-icon" aria-hidden="true" />
                  <input
                    id="lp-password"
                    type={showPassword ? 'text' : 'password'}
                    className="lp-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    <i className={showPassword ? 'ti ti-eye-off' : 'ti ti-eye'} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <button type="submit" className="lp-submit-btn">
                LOG IN
              </button>
            </form>

            <p className="lp-terms">
              By using this service, you understand and agree to the Speedex Services{' '}
              <a href="#" className="lp-terms-link">Terms of Use</a>{' '}and{' '}
              <a href="#" className="lp-terms-link">Privacy Statement</a>.
            </p>
          </div>

          <p className="lp-footer">
            © {new Date().getFullYear()}{' '}
            <span className="lp-footer-co">Speedex Courier &amp; Forwarder, Inc.</span>
            {' '}· All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
