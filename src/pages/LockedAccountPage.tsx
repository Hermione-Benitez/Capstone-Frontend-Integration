import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Clock,
  Mail,
  Phone,
  Home,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  KeyRound,
  X,
} from 'lucide-react';
import {
  checkRateLimit,
  unlockAccount,
  getLastLockedEmployeeId,
  setLastLockedEmployeeId,
  type RateLimitStatus,
} from '../utils/rateLimiter';
import { clearAuthSession } from '../utils/auth';
import './LoginPage.css';
import './LockedAccountPage.css';

export default function LockedAccountPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve target identifier
  const employeeIdParam =
    searchParams.get('id') ||
    searchParams.get('employeeId') ||
    (location.state as any)?.employeeId ||
    getLastLockedEmployeeId() ||
    'User Account';

  const [employeeId, setEmployeeId] = useState(employeeIdParam);
  const [lockStatus, setLockStatus] = useState<RateLimitStatus>(() => checkRateLimit(employeeIdParam));
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const status = checkRateLimit(employeeIdParam);
    return status.isLocked ? status.remainingSeconds : 0;
  });

  // Modal and support request states
  const [showContactModal, setShowContactModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [senderContact, setSenderContact] = useState('');

  // Admin emergency unlock modal state
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState<string | null>(null);

  // Clear any existing session upon landing on locked page
  useEffect(() => {
    clearAuthSession();
  }, []);

  // Update lockout status if query param changes
  useEffect(() => {
    if (employeeIdParam && employeeIdParam !== employeeId) {
      setEmployeeId(employeeIdParam);
      const status = checkRateLimit(employeeIdParam);
      setLockStatus(status);
      setRemainingSeconds(status.isLocked ? status.remainingSeconds : 0);
    }
  }, [employeeIdParam, employeeId]);

  // Live 1-second countdown interval
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Refresh lock status from storage
          const updated = checkRateLimit(employeeId);
          setLockStatus(updated);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, employeeId]);

  // Time conversion
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const isLocked = remainingSeconds > 0;

  // Handle support ticket submission
  const handleSendUnlockRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSent(true);
    setTimeout(() => {
      setShowContactModal(false);
      setRequestSent(false);
      setContactMessage('');
    }, 2500);
  };

  // Handle Admin / Dev Unlock
  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUnlockError(null);

    // Accept root pin or admin passcode
    if (adminPin.trim() === '0000' || adminPin.trim().toLowerCase() === 'admin' || adminPin.trim() === 'speedex2026') {
      unlockAccount(employeeId);
      setLockStatus({
        isLocked: false,
        remainingSeconds: 0,
        attemptsLeft: 5,
        totalAttempts: 0,
        employeeId,
      });
      setRemainingSeconds(0);
      setShowAdminUnlock(false);
      setAdminPin('');
    } else {
      setAdminUnlockError('Invalid Administrator Security PIN.');
    }
  };

  const handleReturnToLogin = () => {
    if (!isLocked) {
      navigate(`/login?id=${encodeURIComponent(employeeId !== 'User Account' ? employeeId : '')}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="locked-page-container">
      {/* ── SPEEDEX TOP HEADER ── */}
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
              <span className="brand-name">SPEEDEX</span>
              <span className="brand-sub">CENTRAL AUTHENTICATION</span>
            </div>
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

      {/* ── MAIN CONTENT ── */}
      <main className="locked-page-main">
        <div className="locked-card">
          {/* Top Lock Icon Halo */}
          <div className="locked-icon-wrapper">
            <div className={`locked-icon-halo ${!isLocked ? 'is-unlocked' : ''}`}>
              {!isLocked ? <CheckCircle2 size={42} /> : <ShieldAlert size={42} />}
              {isLocked && <div className="locked-pulse-ring" />}
            </div>
          </div>

          {/* Header & Main Message */}
          <div className="locked-header-group">
            <div className={`locked-badge ${!isLocked ? 'is-unlocked' : ''}`}>
              {!isLocked ? 'Account Lock Expired' : 'Security Lockout Enforced'}
            </div>
            <h1 className="locked-title">
              {!isLocked ? 'Account Unlocked' : 'Account Temporarily Locked'}
            </h1>
            <p className="locked-instruction">
              {isLocked ? (
                <>
                  Your account has been locked due to <strong>5 consecutive failed login attempts</strong>.
                  <br />
                  You can retry to login again after <strong>24 hours</strong> or contact your administrator.
                </>
              ) : (
                <>
                  The 24-hour security lockout period has expired. You may now proceed to log in with your valid
                  credentials.
                </>
              )}
            </p>
          </div>

          {/* Account Details Strip */}
          <div className="locked-info-strip">
            <div className="locked-info-item">
              <span className="locked-info-label">Account / Employee ID</span>
              <span className="locked-info-value">{employeeId}</span>
            </div>
            <div className="locked-info-item">
              <span className="locked-info-label">Status</span>
              <span className={`locked-info-value ${isLocked ? 'highlight-red' : ''}`}>
                {isLocked ? 'Locked (5 Failed Attempts)' : 'Ready for Sign In'}
              </span>
            </div>
            <div className="locked-info-item">
              <span className="locked-info-label">Cooldown Duration</span>
              <span className="locked-info-value">{isLocked ? '24 Hours' : 'None'}</span>
            </div>
          </div>

          {/* Real-time Countdown Box */}
          <div className={`locked-timer-box ${!isLocked ? 'is-unlocked' : ''}`}>
            <div className={`locked-timer-label ${!isLocked ? 'is-unlocked' : ''}`}>
              <Clock size={16} />
              <span>{isLocked ? 'Remaining Lockout Duration' : 'Lockout Status'}</span>
            </div>

            {isLocked ? (
              <>
                <div className="locked-timer-digits">
                  <div className="timer-block">
                    <span className="timer-num">{String(hours).padStart(2, '0')}</span>
                    <span className="timer-unit">Hours</span>
                  </div>
                  <span className="timer-separator">:</span>
                  <div className="timer-block">
                    <span className="timer-num">{String(minutes).padStart(2, '0')}</span>
                    <span className="timer-unit">Minutes</span>
                  </div>
                  <span className="timer-separator">:</span>
                  <div className="timer-block">
                    <span className="timer-num">{String(seconds).padStart(2, '0')}</span>
                    <span className="timer-unit">Seconds</span>
                  </div>
                </div>
                <p className="locked-timer-subtext">
                  Please wait until the 24-hour countdown reaches zero, or request an administrator reset below.
                </p>
              </>
            ) : (
              <p style={{ margin: 0, color: '#86efac', fontWeight: 600 }}>
                You can now log in to access your Speedex dashboard.
              </p>
            )}
          </div>

          {/* Administrator Contact Details Box */}
          <div className="locked-admin-card">
            <h3 className="locked-admin-title">
              <HelpCircle size={16} color="#38bdf8" />
              <span>Need Immediate Assistance? Contact Your Administrator</span>
            </h3>
            <div className="locked-admin-channels">
              <div className="admin-channel-item">
                <div className="admin-channel-icon">
                  <Mail size={16} />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>IT Security Administrator</span>
                  <a
                    href={`mailto:admin@speedex.com?subject=Speedex%20Account%20Unlock%20Request%20-%20${encodeURIComponent(
                      employeeId
                    )}&body=Hello%20Administrator,%0D%0A%0D%0AMy%20account%20(${encodeURIComponent(
                      employeeId
                    )})%20has%20been%20locked%20due%20to%205%20consecutive%20failed%20login%20attempts.%20Please%20assist%20in%20verifying%20and%20unlocking%20my%20access.%0D%0A%0D%0AThank%20you.`}
                    className="admin-channel-link"
                  >
                    admin@speedex.com
                  </a>
                </div>
              </div>

              <div className="admin-channel-item">
                <div className="admin-channel-icon">
                  <Phone size={16} />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>IT Helpdesk Hotline</span>
                  <a href="tel:+63288887733" className="admin-channel-link">
                    (02) 8888-SPEED (ext. 404) / +63 2 8888 7733
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="locked-actions">
            {isLocked ? (
              <button
                type="button"
                className="btn-locked-primary"
                onClick={() => setShowContactModal(true)}
              >
                <Mail size={18} />
                <span>Contact Administrator to Unlock</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-locked-primary is-unlocked"
                onClick={handleReturnToLogin}
              >
                <ArrowRight size={18} />
                <span>Return to Login Page</span>
              </button>
            )}

            <div className="btn-locked-secondary-group">
              <button
                type="button"
                className="btn-locked-secondary"
                onClick={() => navigate('/')}
              >
                <Home size={16} />
                <span>Back to Home</span>
              </button>

              <button
                type="button"
                className="btn-locked-secondary"
                onClick={() => setShowAdminUnlock(true)}
                title="Administrator Security Unlock"
              >
                <KeyRound size={16} />
                <span>Admin Override</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── MODAL: Contact Administrator Form ── */}
      {showContactModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowContactModal(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="admin-modal-title">
                <Mail size={20} color="#38bdf8" />
                <span>Submit Unlock Request</span>
              </h2>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowContactModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="admin-modal-desc">
              Your unlock request will be immediately dispatched to the Speedex Security & IT Operations team.
            </p>

            {requestSent ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 16px auto', display: 'block' }} />
                <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '1.15rem' }}>
                  Request Dispatched Successfully
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                  Ticket <strong>#SEC-82914</strong> created. An IT administrator will review your account access.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendUnlockRequest}>
                <div className="admin-modal-field">
                  <label>Employee ID / Account Identifier</label>
                  <input type="text" value={employeeId} disabled style={{ opacity: 0.8 }} />
                </div>

                <div className="admin-modal-field">
                  <label>Your Contact Number or Corporate Email</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. employee@speedex.com or 0917-xxx-xxxx"
                    value={senderContact}
                    onChange={(e) => setSenderContact(e.target.value)}
                  />
                </div>

                <div className="admin-modal-field">
                  <label>Reason for Request / Additional Details</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly state what caused the lockout (e.g. forgotten password, typo)..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  />
                </div>

                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="btn-locked-secondary"
                    onClick={() => setShowContactModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-locked-primary" style={{ width: 'auto' }}>
                    <Send size={16} />
                    <span>Send Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Admin Override PIN ── */}
      {showAdminUnlock && (
        <div className="admin-modal-backdrop" onClick={() => setShowAdminUnlock(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="admin-modal-title">
                <KeyRound size={20} color="#f59e0b" />
                <span>Administrator Security Override</span>
              </h2>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowAdminUnlock(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="admin-modal-desc">
              Authorized administrators can bypass the 24-hour lockout by entering the system security PIN.
            </p>

            {adminUnlockError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} />
                <span>{adminUnlockError}</span>
              </div>
            )}

            <form onSubmit={handleAdminUnlock}>
              <div className="admin-modal-field">
                <label>Admin Security PIN / Key</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter administrator PIN..."
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-locked-secondary"
                  onClick={() => setShowAdminUnlock(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-locked-primary"
                  style={{ width: 'auto', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  <RotateCcw size={16} />
                  <span>Unlock Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
