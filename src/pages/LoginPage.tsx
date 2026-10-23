import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  ArrowRight,
  Home,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Package,
} from 'lucide-react';
import {
  clearAuthSession,
  saveAuthSession,
  extractContactNumber,
  normalizePhMobile,
  parseJwtPayload,
  redirectToSubsystem,
  getPrimarySubsystem,
  type AuthSession,
} from '../utils/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, forceLockAccount } from '../utils/rateLimiter';
import { prewarmBackend, getActiveBackendUrl, getBackendCandidates } from '../utils/loadBalancer';
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
    setBannerAlert(null);

    const cleanId = employeeId.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your Employee ID.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Check rate limit & lockout status
    const rateStatus = checkRateLimit(cleanId);
    if (rateStatus.isLocked) {
      navigate(`/locked-account?employeeId=${encodeURIComponent(cleanId)}`, {
        state: {
          employeeId: cleanId,
          remainingSeconds: rateStatus.remainingSeconds,
          lockedUntil: rateStatus.lockedUntil,
        },
        replace: true,
      });
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
      const starsCandidates = getBackendCandidates('stars');
      for (const candidate of starsCandidates) {
        try {
          const starsRes = await fetch(`${candidate}/api/Auth/login`, {
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

            // If contact or name fields are missing from direct login response, query full profile via /api/Auth/me
            const authToken = data.accessToken || data.token;
            if ((!contact || !firstName || !lastName) && authToken) {
              try {
                const meRes = await fetch(`${candidate}/api/Auth/me`, {
                  signal: abortController.signal,
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                  },
                });
                if (meRes.ok) {
                  const meRaw = await meRes.json();
                  const meData = meRaw?.data || meRaw;
                  if (meData) {
                    contact = contact || extractContactNumber(meData);
                    firstName = firstName || meData.firstName || '';
                    middleName = middleName || meData.middleName || '';
                    lastName = lastName || meData.lastName || '';
                    suffix = suffix || meData.suffix || '';
                    fullName = fullName || meData.fullName || `${firstName} ${lastName}`.trim();
                  }
                }
              } catch (e) {
                console.warn('Could not probe /api/Auth/me for STARS user:', e);
              }
            }

            // Fallback: Query by employee number if contact is still missing
            if ((!contact || !firstName || !lastName) && authToken) {
              try {
                const userRes = await fetch(`${candidate}/api/User/employee-number/${encodeURIComponent(cleanId)}`, {
                  signal: abortController.signal,
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                  },
                });
                if (userRes.ok) {
                  const userRaw = await userRes.json();
                  const userData = userRaw?.data || userRaw;
                  if (userData) {
                    contact = contact || extractContactNumber(userData);
                    firstName = firstName || userData.firstName || '';
                    middleName = middleName || userData.middleName || '';
                    lastName = lastName || userData.lastName || '';
                    suffix = suffix || userData.suffix || '';
                    fullName = fullName || userData.fullName || '';
                  }
                }
              } catch (e) {
                console.warn('Could not probe /api/User/employee-number for STARS user:', e);
              }
            }

            // Fallback: Query onboarding-status
            if (!contact || !firstName || !lastName) {
              try {
                const statusRes = await fetch(`${candidate}/api/Auth/onboarding-status/${encodeURIComponent(cleanId)}`, {
                  signal: abortController.signal,
                  headers: {
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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

            const normalizedContact = normalizePhMobile(
              contact || data.contactNumber || data.mobileNumber || data.phoneNumber || data.phone || ''
            );

            profileData = {
              firstName,
              middleName,
              lastName,
              suffix,
              contactNumber: normalizedContact,
              employeeId: cleanId,
              fullName: fullName || cleanId,
            };

            const systemTokens: NonNullable<AuthSession['systemTokens']> = {
              stars: {
                token: data.accessToken || data.token || '',
                refreshToken: data.refreshToken || '',
                role: data.role || 'Staff',
              },
            };

            // Companion Authentication: Authenticate with DMS if access is authorized
            if (allowedList.includes('DMS')) {
              const dmsCandidates = getBackendCandidates('dms');
              for (const candidate of dmsCandidates) {
                try {
                  const dmsRes = await fetch(`${candidate}/api/auth/login`, {
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
                    let dmsRole = rawDms.role;
                    const claims = parseJwtPayload(rawDms.token);
                    if (claims) {
                      dmsRole = dmsRole || claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || claims.role;
                    }
                    systemTokens.dms = {
                      token: rawDms.token,
                      refreshToken: rawDms.refreshToken || '',
                      role: dmsRole,
                    };
                    break;
                  }
                } catch (dmsErr) {
                  console.warn('Could not authenticate simultaneously with DMS:', dmsErr);
                }
              }
            }

            // Companion Authentication: Authenticate with FOMS if access is authorized
            if (allowedList.includes('FOMS')) {
              const fomsCandidates = getBackendCandidates('foms');
              for (const candidate of fomsCandidates) {
                try {
                  const fomsRes = await fetch(`${candidate}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      employeeId: cleanId,
                      employeeNumber: cleanId,
                      password,
                    }),
                    signal: abortController.signal,
                  });
                  const rawFoms = await fomsRes.json().catch(() => null);
                  const fomsData = rawFoms?.data || rawFoms;
                  const fToken = fomsData?.accessToken || fomsData?.tokens?.accessToken || fomsData?.token;
                  if (fomsRes.ok && fToken) {
                    systemTokens.foms = {
                      token: fToken,
                      refreshToken: fomsData?.refreshToken || fomsData?.tokens?.refreshToken || '',
                      role: fomsData?.role || fomsData?.user?.role,
                    };
                    break;
                  }
                } catch (fomsErr) {
                  console.warn('Could not authenticate simultaneously with FOMS:', fomsErr);
                }
              }
            }

            sessionPayload = {
              authToken: data.accessToken || data.token || '',
              refreshToken: data.refreshToken || '',
              userRole: data.role || 'Staff',
              employeeId: cleanId,
              employeeName: fullName || cleanId,
              allowedSystems: allowedList,
              contactNumber: normalizedContact,
              systemTokens,
            };
            break;
          } else if (rawStars?.message) {
            failureReason = rawStars.message;
            break;
          }
        } catch (err: unknown) {
          if ((err as Error)?.name === 'AbortError') return;
          console.warn(`STARS central auth check error on ${candidate}:`, err);
        }
      }

      // 2. Fallback: Authenticate via DMS for legacy accounts not yet synced
      if (!authSuccess) {
        const dmsCandidates = getBackendCandidates('dms');
        for (const candidate of dmsCandidates) {
          try {
            const dmsRes = await fetch(`${candidate}/api/auth/login`, {
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
              const claims = parseJwtPayload(rawDms.token);
              if (claims) {
                role = role || claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || claims.role;
                name = name || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || claims.name;
              }

              // Fetch full user profile from DMS to resolve canonical name, role, and system access
              let employeeName = name || cleanId;
              let userRole = role || 'ADMIN';
              let systemAccess = 'All Systems';

              try {
                const profileRes = await fetch(`${candidate}/api/auth/profile`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${rawDms.token}`,
                  },
                  signal: abortController.signal,
                });
                if (profileRes.ok) {
                  const profileBody = await profileRes.json().catch(() => null);
                  if (profileBody) {
                    employeeName = profileBody.name || employeeName;
                    userRole = profileBody.role || userRole;
                    systemAccess = profileBody.systemAccess || systemAccess;
                  }
                }
              } catch (profileErr) {
                console.warn('Could not probe DMS profile:', profileErr);
              }

              // Compute allowed systems for DMS accounts
              // DMS-native accounts (such as EMP-001) are scoped exclusively to DMS,
              // unless the account is root superadmin ('0000') or was explicitly granted multi-system access in STARS.
              // Note: DMS internal role ('ADMIN') and internal systemAccess ('All Systems') refer only to DMS internal
              // feature modules (Delivery Tracker, Operations, Client Portal), NOT cross-system access to STARS or FOMS.
              const allowedList: string[] = cleanId === '0000' ? ['STARS', 'DMS', 'FOMS'] : ['DMS'];

              sessionPayload = {
                authToken: rawDms.token,
                refreshToken: rawDms.refreshToken || '',
                userRole: userRole,
                employeeId: cleanId,
                employeeName: employeeName,
                allowedSystems: allowedList,
                systemTokens: {
                  dms: {
                    token: rawDms.token,
                    refreshToken: rawDms.refreshToken || '',
                    role: userRole,
                  },
                },
              };
              break;
            } else if (rawDms?.message) {
              failureReason = rawDms.message;
              break;
            }
          } catch (err: unknown) {
            if ((err as Error)?.name === 'AbortError') return;
            console.warn(`DMS fallback auth check error on ${candidate}:`, err);
          }
        }
      }

      // 3. Fallback: Authenticate via FOMS for legacy accounts not yet synced
      if (!authSuccess) {
        const fomsCandidates = getBackendCandidates('foms');
        for (const candidate of fomsCandidates) {
          try {
            const fomsRes = await fetch(`${candidate}/api/auth/login`, {
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
                allowedSystems: cleanId === '0000' ? ['STARS', 'DMS', 'FOMS'] : ['FOMS'],
                systemTokens: {
                  foms: {
                    token: token,
                    refreshToken: fomsData.refreshToken || fomsData.tokens?.refreshToken || '',
                    role: user.role || 'Accountant',
                  },
                },
              };
              break;
            } else if (rawFoms?.message || rawFoms?.error) {
              failureReason = rawFoms.message || rawFoms.error;
              break;
            }
          } catch (err: unknown) {
            if ((err as Error)?.name === 'AbortError') return;
            console.warn(`FOMS fallback auth check error on ${candidate}:`, err);
          }
        }
      }

      if (!authSuccess || !sessionPayload) {
        // If server indicated an explicit account lockout
        if (
          failureReason.toLowerCase().includes('locked') ||
          failureReason.toLowerCase().includes('lockout')
        ) {
          const lockStatus = forceLockAccount(cleanId, undefined, failureReason);
          navigate(`/locked-account?employeeId=${encodeURIComponent(cleanId)}`, {
            state: {
              employeeId: cleanId,
              remainingSeconds: lockStatus.remainingSeconds,
              lockedUntil: lockStatus.lockedUntil,
            },
            replace: true,
          });
          return;
        }

        const failStatus = recordFailedAttempt(cleanId, failureReason);
        if (failStatus.isLocked) {
          // 5 consecutive failed attempts reached: proceed directly to locked account page
          navigate(`/locked-account?employeeId=${encodeURIComponent(cleanId)}`, {
            state: {
              employeeId: cleanId,
              remainingSeconds: failStatus.remainingSeconds,
              lockedUntil: failStatus.lockedUntil,
            },
            replace: true,
          });
          return;
        } else {
          setErrorMessage(
            `${failureReason} (${failStatus.attemptsLeft} attempt${failStatus.attemptsLeft === 1 ? '' : 's'} remaining before account lockout)`
          );
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
          const contactQuery = profileData?.contactNumber ? `&contactNumber=${encodeURIComponent(profileData.contactNumber)}` : '';
          const firstQuery = profileData?.firstName ? `&firstName=${encodeURIComponent(profileData.firstName)}` : '';
          const lastQuery = profileData?.lastName ? `&lastName=${encodeURIComponent(profileData.lastName)}` : '';
          navigate(`/onboarding?employeeId=${encodeURIComponent(cleanId)}${contactQuery}${firstQuery}${lastQuery}`, {
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

      // Check single-system vs multi-system access
      const singleSubsystem = getPrimarySubsystem(sessionPayload);
      if (singleSubsystem && cleanId !== '0000') {
        // Account has authorization for strictly ONE system: bypass the portal and enter dashboard immediately
        redirectToSubsystem(singleSubsystem, sessionPayload);
        return;
      }

      // Fully onboarded multi-system user (or superadmin 0000): Navigate to Central Landing Page (/portal)
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
          </a>
          <nav className="speedex-nav-links" aria-label="Speedex System Navigation">
            <a
              href="/"
              className="speedex-nav-link speedex-nav-link-public"
              title="Back to Home"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              <Home size={14} />
              <span>Back to Home</span>
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

            {/* Unified Alert Banner Slot (Replaces instead of stacking) */}
            {lockoutSeconds > 0 ? (
              <div className="alert-banner warning">
                <RefreshCw size={18} className="spinner" />
                <div>
                  <strong>Rate Limit Active:</strong> Please wait {lockoutSeconds} seconds before submitting your next attempt.
                </div>
              </div>
            ) : errorMessage ? (
              <div className="alert-banner danger">
                <AlertTriangle size={18} />
                <div>{errorMessage}</div>
              </div>
            ) : bannerAlert ? (
              <div className={`alert-banner ${bannerAlert.type}`}>
                {bannerAlert.type === 'warning' && <AlertTriangle size={18} />}
                {bannerAlert.type === 'success' && <CheckCircle size={18} />}
                <div>{bannerAlert.message}</div>
              </div>
            ) : null}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {/* Employee ID */}
              <div className="field-group">
                <label htmlFor="employee-id" className="field-label">
                  Employee ID <span style={{ color: '#E31A1A' }}>*</span>
                </label>
                <div className="field-wrapper">
                  <span className="field-icon">
                    <User size={16} />
                  </span>
                  <input
                    id="employee-id"
                    type="text"
                    className="field-input"
                    placeholder="Enter your Employee ID"
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
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
