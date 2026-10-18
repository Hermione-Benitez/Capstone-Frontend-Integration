import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Server,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { clearAuthSession, saveAuthSession, redirectToSubsystem } from '../utils/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../utils/rateLimiter';
import { prewarmBackend, getActiveBackendUrl } from '../utils/loadBalancer';
import './LoginPage.css';

type SystemKey = 'stars' | 'dms' | 'foms';

interface SystemOption {
  key: SystemKey;
  name: string;
  badge: string;
  idPlaceholder: string;
}

const SYSTEM_OPTIONS: SystemOption[] = [
  {
    key: 'stars',
    name: 'STARS — Tracking & Audit System',
    badge: 'STARS',
    idPlaceholder: 'e.g. MGR001 or 0000',
  },
  {
    key: 'dms',
    name: 'DMS — Delivery Management System',
    badge: 'DMS',
    idPlaceholder: 'e.g. EMP-001 or DRV-001',
  },
  {
    key: 'foms',
    name: 'FOMS — Financial Operations System',
    badge: 'FOMS',
    idPlaceholder: 'e.g. EMP-001 or accountant',
  },
];

const LAST_SYSTEM_KEY = 'speedex_last_selected_system';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  // Selected system state (restores last selection or query parameter)
  const [selectedSystem, setSelectedSystem] = useState<SystemKey>(() => {
    const params = new URLSearchParams(window.location.search);
    const systemParam = params.get('system')?.toLowerCase() as SystemKey;
    if (systemParam && ['stars', 'dms', 'foms'].includes(systemParam)) {
      return systemParam;
    }
    const saved = localStorage.getItem(LAST_SYSTEM_KEY) as SystemKey;
    return saved && ['stars', 'dms', 'foms'].includes(saved) ? saved : 'stars';
  });

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status and loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bannerAlert, setBannerAlert] = useState<{ type: 'warning' | 'success' | 'danger'; message: string } | null>(null);

  // Rate limit lockout state
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // In-flight request controller to cancel duplicate requests on re-submit
  const abortControllerRef = useRef<AbortController | null>(null);

  // Trigger silent Azure App Service pre-warming on mount and when system changes
  useEffect(() => {
    prewarmBackend(selectedSystem);
  }, [selectedSystem]);

  // Handle Single Logout (SLO) interception from query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);

    const action = searchParams.get('action') || hashParams.get('action');
    const reason = searchParams.get('reason') || hashParams.get('reason');
    const system = searchParams.get('system') || hashParams.get('system');

    if (system && ['stars', 'dms', 'foms'].includes(system.toLowerCase())) {
      setSelectedSystem(system.toLowerCase() as SystemKey);
      localStorage.setItem(LAST_SYSTEM_KEY, system.toLowerCase());
    }

    if (action === 'logout') {
      clearAuthSession();

      if (reason === 'inactivity') {
        setBannerAlert({
          type: 'warning',
          message: 'Your session expired due to inactivity. Please sign in again with your credentials.',
        });
      } else if (reason === 'session_expired') {
        setBannerAlert({
          type: 'warning',
          message: 'Your security session has expired. Please enter your credentials to continue.',
        });
      } else if (reason === 'email_verified') {
        setBannerAlert({
          type: 'success',
          message: 'Email verified successfully! You may now sign in.',
        });
      } else {
        setBannerAlert({
          type: 'success',
          message: 'You have been logged out successfully.',
        });
      }
    }
  }, [location.search]);

  // Check rate limits when employeeId changes or on tick
  useEffect(() => {
    if (!employeeId.trim()) return;
    const status = checkRateLimit(employeeId.trim());
    if (status.isLocked) {
      setLockoutSeconds(status.remainingSeconds);
    }
  }, [employeeId]);

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

  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sys = e.target.value as SystemKey;
    setSelectedSystem(sys);
    localStorage.setItem(LAST_SYSTEM_KEY, sys);
    setErrorMessage(null);
    prewarmBackend(sys);
  };

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
      const backendUrl = getActiveBackendUrl(selectedSystem);

      if (selectedSystem === 'stars') {
        // Authenticate against STARS Backend API
        const response = await fetch(`${backendUrl}/api/Auth/login`, {
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

        const raw = await response.json().catch(() => null);

        if (!response.ok || !raw?.isSuccess) {
          const errMsg = raw?.message || 'Invalid Employee ID or password.';
          const failStatus = recordFailedAttempt(cleanId);
          if (failStatus.isLocked) {
            setLockoutSeconds(failStatus.remainingSeconds);
            setErrorMessage(`Account locked due to repeated failures. Please wait ${failStatus.remainingSeconds}s.`);
          } else {
            setErrorMessage(`${errMsg} (${failStatus.attemptsLeft} attempts remaining)`);
          }
          return;
        }

        // Authentication Successful
        resetRateLimit(cleanId);
        const data = raw.data || raw;
        const sessionPayload = {
          authToken: data.accessToken || data.token || '',
          refreshToken: data.refreshToken || '',
          userRole: data.role || 'Staff',
          employeeId: cleanId,
          employeeName: data.fullName || data.userName || cleanId,
        };
        saveAuthSession(sessionPayload);

        // Check if Onboarding is required (temporary password not yet changed)
        if (data.isPasswordChanged === false && cleanId !== '0000') {
          startTransition(() => {
            navigate(`/onboarding?system=stars&employeeId=${encodeURIComponent(cleanId)}`);
          });
          return;
        }

        // Check if Terms / Privacy acceptance is required
        if (data.hasAcceptedTerms === false) {
          startTransition(() => {
            navigate(`/privacy-notice?system=stars&employeeId=${encodeURIComponent(cleanId)}`);
          });
          return;
        }

        // Direct handoff to STARS Dashboard
        redirectToSubsystem('stars', sessionPayload);
      } else if (selectedSystem === 'dms') {
        // Authenticate against DMS Backend API
        const response = await fetch(`${backendUrl}/api/auth/login`, {
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

        const raw = await response.json().catch(() => null);

        if (!response.ok || !raw?.token) {
          const errMsg = raw?.message || 'Invalid DMS Employee ID or password.';
          const failStatus = recordFailedAttempt(cleanId);
          if (failStatus.isLocked) {
            setLockoutSeconds(failStatus.remainingSeconds);
            setErrorMessage(`Account locked due to repeated failures. Please wait ${failStatus.remainingSeconds}s.`);
          } else {
            setErrorMessage(`${errMsg} (${failStatus.attemptsLeft} attempts remaining)`);
          }
          return;
        }

        // Authentication Successful
        resetRateLimit(cleanId);

        // Decode JWT claims for role & name fallback if not present in root response
        let role = raw.role;
        let name = raw.name;
        if ((!role || !name) && typeof raw.token === 'string' && raw.token.includes('.')) {
          try {
            const tokenPayload = JSON.parse(atob(raw.token.split('.')[1]));
            role = role || tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || tokenPayload.role;
            name = name || tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || tokenPayload.name;
          } catch {
            // fallback gracefully
          }
        }

        const sessionPayload = {
          authToken: raw.token,
          refreshToken: raw.refreshToken || '',
          userRole: role || 'OP. TEAM',
          employeeId: cleanId,
          employeeName: name || cleanId,
        };
        saveAuthSession(sessionPayload);

        // Direct handoff to DMS Dashboard
        redirectToSubsystem('dms', sessionPayload);
      } else if (selectedSystem === 'foms') {
        // Authenticate against FOMS Backend API
        const response = await fetch(`${backendUrl}/api/auth/login`, {
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

        const raw = await response.json().catch(() => null);

        if (!response.ok || (!raw?.accessToken && !raw?.tokens?.accessToken)) {
          const errMsg = raw?.message || raw?.error || 'Invalid FOMS credentials.';
          const failStatus = recordFailedAttempt(cleanId);
          if (failStatus.isLocked) {
            setLockoutSeconds(failStatus.remainingSeconds);
            setErrorMessage(`Account locked due to repeated failures. Please wait ${failStatus.remainingSeconds}s.`);
          } else {
            setErrorMessage(`${errMsg} (${failStatus.attemptsLeft} attempts remaining)`);
          }
          return;
        }

        // Authentication Successful
        resetRateLimit(cleanId);
        const accessToken = raw.accessToken || raw.tokens?.accessToken;
        const refreshToken = raw.refreshToken || raw.tokens?.refreshToken || '';
        const user = raw.user || {};

        const sessionPayload = {
          authToken: accessToken,
          refreshToken,
          userRole: user.role || 'Accountant',
          employeeId: user.employeeId || cleanId,
          employeeName: user.fullName || cleanId,
        };
        saveAuthSession(sessionPayload);

        // Direct handoff to FOMS Dashboard
        redirectToSubsystem('foms', sessionPayload);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('Authentication request error:', err);
      // Differentiate network failure from bad credentials: do NOT burn rate limit on server/network timeouts
      setErrorMessage(
        `Unable to reach the ${selectedSystem.toUpperCase()} authentication server. Please check your connection or wait a moment while the server initializes.`
      );
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  const activeOption = SYSTEM_OPTIONS.find((s) => s.key === selectedSystem) || SYSTEM_OPTIONS[0];

  return (
    <div className="login-root">
      <div className="login-card-wrapper">
        <div className="login-card">
          <header className="login-header">
            <div className="brand-badge">
              <Shield size={14} />
              Central Gateway
            </div>
            <h1 className="brand-title">
              Speedex <span className="accent">One-Login</span>
            </h1>
            <p className="brand-subtitle">
              Unified authentication for Speedex operational systems
            </p>
          </header>

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
            {/* 1. Target System Manual Dropdown Selector */}
            <div className="form-group">
              <label htmlFor="system-select" className="form-label">
                Target Operational System
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Server size={18} />
                </span>
                <select
                  id="system-select"
                  className="form-select"
                  value={selectedSystem}
                  onChange={handleSystemChange}
                  disabled={isSubmitting || lockoutSeconds > 0}
                >
                  {SYSTEM_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Employee ID / Username */}
            <div className="form-group">
              <label htmlFor="employee-id" className="form-label">
                Employee ID or Username
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <User size={18} />
                </span>
                <input
                  id="employee-id"
                  type="text"
                  className="form-input"
                  placeholder={activeOption.idPlaceholder}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={isSubmitting || lockoutSeconds > 0}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* 3. Password */}
            <div className="form-group">
              <label htmlFor="password-input" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || lockoutSeconds > 0}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                  <span>Sign In to {activeOption.badge}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <footer className="login-footer">
            <div>
              Need to access a different service?{' '}
              <a href="/portal" className="footer-link">
                View Central Portal Directory
              </a>
            </div>
            <div className="security-note">
              <Lock size={12} />
              Protected by Speedex Dual-Layer Sliding Window &amp; Token Invalidation
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
