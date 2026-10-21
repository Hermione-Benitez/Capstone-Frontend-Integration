import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  ArrowRight,
  Globe,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Package,
} from 'lucide-react';
import { clearAuthSession, saveAuthSession, extractContactNumber, type AuthSession } from '../utils/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../utils/rateLimiter';
import { prewarmBackend, getActiveBackendUrl } from '../utils/loadBalancer';
import LegalDocumentModal, { type LegalDocType } from '../components/LegalDocumentModal';
import './LoginPage.css';

const REMEMBER_ME_KEY = 'speedex_remember_me';
const REMEMBERED_ID_KEY = 'speedex_remembered_employee_id';

function getRememberedId(): string {
  if (typeof window === 'undefined') return '';
  const isRemembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  if (!isRemembered) return '';
  return localStorage.getItem(REMEMBERED_ID_KEY) || '';
}

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  });

  const [employeeId, setEmployeeId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id') || params.get('employeeId') || '';
    if (idParam) return idParam;
    return getRememberedId();
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status and loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bannerAlert, setBannerAlert] = useState<{ type: 'warning' | 'success' | 'danger'; message: string } | null>(null);

  // Rate limit lockout state
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Legal modal state (Terms of Use / Privacy Statement)
  const [legalModalType, setLegalModalType] = useState<LegalDocType | null>(null);

  // In-flight request controller to cancel duplicate requests on re-submit
  const abortControllerRef = useRef<AbortController | null>(null);

  // Trigger silent Azure App Service pre-warming for backends on mount
  useEffect(() => {
    prewarmBackend('stars');
    prewarmBackend('dms');
    prewarmBackend('foms');
  }, []);

  // Handle Single Logout (SLO) interception from query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);

    const action = searchParams.get('action') || hashParams.get('action');
    const reason = searchParams.get('reason') || hashParams.get('reason');

    if (action === 'logout') {
      clearAuthSession();
      if (reason === 'inactivity') {
        setBannerAlert({
          type: 'warning',
          message: 'Your session expired due to inactivity. Please sign in again to continue.',
        });
      } else if (reason === 'session_expired') {
        setBannerAlert({
          type: 'warning',
          message: 'Your session has expired. Please sign in again.',
        });
      } else {
        setBannerAlert({
          type: 'success',
          message: 'You have been securely signed out.',
        });
      }
    }
  }, [location.search]);

  // Live countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = employeeId.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your Employee ID or Username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Check rate limit status
    const rateStatus = checkRateLimit(cleanId);
    if (rateStatus.isLocked) {
      setLockoutSeconds(rateStatus.remainingSeconds);
      setErrorMessage(`Too many failed attempts. Please wait ${rateStatus.remainingSeconds}s before trying again.`);
      return;
    }

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsSubmitting(true);

    try {
      const starsUrl = getActiveBackendUrl('stars');
      const dmsUrl = getActiveBackendUrl('dms');
      const fomsUrl = getActiveBackendUrl('foms');

      let authSuccess = false;
      let sessionPayload: AuthSession | null = null;
      let isPasswordChanged: boolean | undefined = true;
      let hasAcceptedTerms: boolean | undefined = true;
      let profileData: Record<string, any> | null = null;
      let failureReason = 'Invalid Employee ID or password.';

      // 1. Primary Central Identity: Authenticate via STARS Backend
      try {
        const starsRes = await fetch(`${starsUrl}/api/Auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: cleanId,
            employeeNumber: cleanId,
            employeeId: cleanId,
            username: cleanId,
            password,
          }),
          signal: abortController.signal,
        });

        const rawStars = await starsRes.json().catch(() => null);

        if (starsRes.ok && rawStars?.isSuccess) {
          const data = rawStars.data || rawStars;
          authSuccess = true;
          isPasswordChanged = data.isPasswordChanged;
          hasAcceptedTerms = data.hasAcceptedTerms;

          // Parse allowed systems
          let allowedList: string[] = ['STARS'];
          if (cleanId === '0000') {
            allowedList = ['STARS', 'DMS', 'FOMS'];
          } else if (data.allowedSystems) {
            allowedList = data.allowedSystems
              .split(',')
              .map((s: string) => s.trim().toUpperCase())
              .filter(Boolean);
          }

          let contact = extractContactNumber(data);
          let firstName = data.firstName || '';
          let middleName = data.middleName || '';
          let lastName = data.lastName || '';
          let suffix = data.suffix || '';
          let fullName = data.fullName || data.userName || '';

          // If contact or name fields are missing from direct login response, query onboarding-status
          if (!contact || !firstName || !lastName) {
            try {
              const statusRes = await fetch(`${starsUrl}/api/Auth/onboarding-status/${encodeURIComponent(cleanId)}`, {
                signal: abortController.signal,
                headers: {
                  ...(data.accessToken || data.token ? { Authorization: `Bearer ${data.accessToken || data.token}` } : {}),
                },
              });
              if (statusRes.ok) {
                const statusRaw = await statusRes.json();
                const statusData = statusRaw?.data || statusRaw;
                if (statusData) {
                  contact = contact || extractContactNumber(statusData);
                  firstName = firstName || statusData.firstName || '';
                  middleName = middleName || statusData.middleName || '';
                  lastName = lastName || statusData.lastName || '';
                  suffix = suffix || statusData.suffix || '';
                  fullName = fullName || statusData.fullName || statusData.name || '';
                }
              }
            } catch (e) {
              console.warn('Could not probe onboarding status for STARS:', e);
            }
          }

          profileData = {
            firstName,
            middleName,
            lastName,
            suffix,
            contactNumber: contact || data.contactNumber || data.mobileNumber || data.phoneNumber || data.phone || '',
            employeeId: cleanId,
            fullName: fullName || cleanId,
          };

          sessionPayload = {
            authToken: data.accessToken || data.token || '',
            refreshToken: data.refreshToken || '',
            userRole: data.role || 'Staff',
            employeeId: cleanId,
            employeeName: fullName || cleanId,
            allowedSystems: allowedList,
          };
        } else if (rawStars?.message) {
          failureReason = rawStars.message;
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        console.warn('STARS central auth check error:', err);
      }

      // 2. Fallback: Authenticate via DMS for legacy accounts not yet synced
      if (!authSuccess) {
        try {
          const dmsRes = await fetch(`${dmsUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: cleanId,
              username: cleanId,
              identifier: cleanId,
              password,
            }),
            signal: abortController.signal,
          });

          const rawDms = await dmsRes.json().catch(() => null);

          if (dmsRes.ok && rawDms?.token) {
            authSuccess = true;
            let role = rawDms.role;
            let name = rawDms.name;
            if ((!role || !name) && typeof rawDms.token === 'string' && rawDms.token.includes('.')) {
              try {
                const tokenPayload = JSON.parse(atob(rawDms.token.split('.')[1]));
                role = role || tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || tokenPayload.role;
                name = name || tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || tokenPayload.name;
              } catch {
                // ignore
              }
            }

            sessionPayload = {
              authToken: rawDms.token,
              refreshToken: rawDms.refreshToken || '',
              userRole: role || 'Staff',
              employeeId: cleanId,
              employeeName: name || cleanId,
              allowedSystems: ['DMS'],
            };
          } else if (rawDms?.message) {
            failureReason = rawDms.message;
          }
        } catch (err) {
          console.warn('DMS fallback auth check error:', err);
        }
      }

      // 3. Fallback: Authenticate via FOMS for legacy accounts not yet synced
      if (!authSuccess) {
        try {
          const fomsRes = await fetch(`${fomsUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: cleanId,
              employeeNumber: cleanId,
              username: cleanId,
              identifier: cleanId,
              password,
            }),
            signal: abortController.signal,
          });

          const rawFoms = await fomsRes.json().catch(() => null);
          const fomsData = rawFoms?.data || rawFoms;
          const token = fomsData?.accessToken || fomsData?.tokens?.accessToken;

          if (fomsRes.ok && token) {
            authSuccess = true;
            const user = fomsData.user || fomsData.profile || {};
            sessionPayload = {
              authToken: token,
              refreshToken: fomsData.refreshToken || fomsData.tokens?.refreshToken || '',
              userRole: user.role || 'Accountant',
              employeeId: user.employeeId || cleanId,
              employeeName: user.fullName || user.name || cleanId,
              allowedSystems: ['FOMS'],
            };
          } else if (rawFoms?.message || rawFoms?.error) {
            failureReason = rawFoms.message || rawFoms.error;
          }
        } catch (err) {
          console.warn('FOMS fallback auth check error:', err);
        }
      }

      if (!authSuccess || !sessionPayload) {
        const failStatus = recordFailedAttempt(cleanId);
        if (failStatus.isLocked) {
          setLockoutSeconds(failStatus.remainingSeconds);
          setErrorMessage(`Account locked due to repeated failures. Please wait ${failStatus.remainingSeconds}s.`);
        } else {
          setErrorMessage(`${failureReason} (${failStatus.attemptsLeft} attempts remaining)`);
        }
        return;
      }

      // Authentication Successful
      resetRateLimit(cleanId);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        localStorage.setItem(REMEMBERED_ID_KEY, cleanId);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(REMEMBERED_ID_KEY);
      }

      saveAuthSession(sessionPayload);

      // Check if Onboarding is required (temporary password not yet changed)
      if (isPasswordChanged === false && cleanId !== '0000') {
        if (profileData) {
          try {
            sessionStorage.setItem('onboarding_profile', JSON.stringify(profileData));
          } catch {
            // ignore
          }
        }
        startTransition(() => {
          navigate(`/onboarding?employeeId=${encodeURIComponent(cleanId)}`, {
            state: { profile: profileData },
          });
        });
        return;
      }

      // Check if Privacy Agreement is required
      if (hasAcceptedTerms === false) {
        startTransition(() => {
          navigate(`/privacy-notice?employeeId=${encodeURIComponent(cleanId)}`);
        });
        return;
      }

      // Fully onboarded user: Navigate to Central Landing Page (/portal)
      startTransition(() => {
        navigate('/portal');
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('Login error:', err);
      setErrorMessage('Unable to connect to authentication servers. Please verify your internet connection.');
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
            <a
              href="/"
              className="speedex-nav-link speedex-nav-link-public"
              title="Return to Public Website"
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
                <Package size={22} />
              </div>
              <div>
                <span className="brand-title-badge">Speedex One-Login</span>
                <span className="brand-sub-badge">CENTRAL GATEWAY</span>
              </div>
            </div>

            <div className="login-headline">
              <h2>
                One Secure Account.<br />
                <span className="headline-accent">All Enterprise Systems.</span>
              </h2>
              <p className="headline-body">
                Speedex Enterprise Central Authentication provides single sign-on access across our entire ecosystem with role-based access governance and audit logging.
              </p>
            </div>

            {/* Ecosystem Feature Cards */}
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-num">1</div>
                <div className="feature-text">
                  <strong>Smart Tracking &amp; Routing System (STARS)</strong>
                  <p>Real-time vehicle tracking, route optimization, and operational analytics.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-num">2</div>
                <div className="feature-text">
                  <strong>Delivery Management System (DMS)</strong>
                  <p>Driver task dispatching, run-sheet management, and proof of delivery.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-num">3</div>
                <div className="feature-text">
                  <strong>Financial Operations System (FOMS)</strong>
                  <p>Accounts receivable, billing, invoices, and payment collections.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="login-right">
          <div className="login-card">
            <div className="card-header">
              <span className="header-badge">CENTRAL ONE-LOGIN</span>
              <h1 className="card-title">Welcome to Speedex</h1>
              <p className="card-subtitle">
                Sign in with your employee credentials to access your authorized systems.
              </p>
            </div>

            {/* Contextual Alert Banner */}
            {bannerAlert && (
              <div className={`alert-banner ${bannerAlert.type}`}>
                {bannerAlert.type === 'warning' && <AlertTriangle size={18} />}
                {bannerAlert.type === 'success' && <CheckCircle size={18} />}
                <div>{bannerAlert.message}</div>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="alert-banner danger">
                <AlertTriangle size={18} />
                <div>{errorMessage}</div>
              </div>
            )}

            {/* Rate Limit Lockout Banner */}
            {lockoutSeconds > 0 && (
              <div className="alert-banner warning">
                <RefreshCw size={18} className="spinner" />
                <div>
                  <strong>Rate Limit Active:</strong> Please wait {lockoutSeconds} seconds before submitting your next attempt.
                </div>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {/* Employee ID / Username */}
              <div className="field-group">
                <label htmlFor="employee-id" className="field-label">
                  Employee ID or Identifier <span style={{ color: '#E31A1A' }}>*</span>
                </label>
                <div className="field-wrapper">
                  <span className="field-icon">
                    <User size={16} />
                  </span>
                  <input
                    id="employee-id"
                    type="text"
                    className="field-input"
                    placeholder="e.g. MGR001, EMP-001, or Username"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={isSubmitting || lockoutSeconds > 0}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field-group">
                <label htmlFor="password-input" className="field-label">
                  Password <span style={{ color: '#E31A1A' }}>*</span>
                </label>
                <div className="field-wrapper">
                  <span className="field-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className="field-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || lockoutSeconds > 0}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password Form Options */}
              <div className="login-form-options">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    className="remember-me-checkbox"
                    checked={rememberMe}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRememberMe(checked);
                      if (!checked) {
                        localStorage.removeItem(REMEMBER_ME_KEY);
                        localStorage.removeItem(REMEMBERED_ID_KEY);
                      }
                    }}
                    disabled={isSubmitting || lockoutSeconds > 0}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    const idQuery = employeeId.trim() ? `?id=${encodeURIComponent(employeeId.trim())}` : '';
                    navigate(`/forgot-password${idQuery}`);
                  }}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || lockoutSeconds > 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Authenticating...</span>
                  </>
                ) : lockoutSeconds > 0 ? (
                  <span>Locked ({lockoutSeconds}s)</span>
                ) : (
                  <>
                    <span>Sign In to Speedex</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Prompt for Public Portal tracking/advisories */}
            <div className="public-portal-prompt">
              <span>Looking to track a parcel or view advisories?</span>{' '}
              <button
                type="button"
                className="public-portal-prompt-link"
                onClick={() => navigate('/')}
              >
                Return to Public Portal &rarr;
              </button>
            </div>

            {/* Legal Notice / Terms & Privacy Links */}
            <div className="login-legal-notice">
              <span>By signing in, you understand and agree to the Speedex</span>{' '}
              <button
                type="button"
                className="legal-notice-btn"
                onClick={() => setLegalModalType('terms')}
              >
                Terms of Use
              </button>
              {' '}and{' '}
              <button
                type="button"
                className="legal-notice-btn"
                onClick={() => setLegalModalType('privacy')}
              >
                Privacy Statement
              </button>
              .
            </div>

            <footer className="login-footer">
              <p className="login-footer-copy">
                © 2026 <span className="login-footer-company">Speedex Courier &amp; Forwarder, Inc.</span> · All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* ── LEGAL DOCUMENT MODAL (Terms of Use / Privacy Statement) ── */}
      <LegalDocumentModal
        isOpen={legalModalType !== null}
        type={legalModalType || 'terms'}
        onClose={() => setLegalModalType(null)}
        onSwitchType={(type) => setLegalModalType(type)}
      />
    </div>
  );
}
