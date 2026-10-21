import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Globe,
  Sparkles,
  ShieldCheck,
  Edit3,
  KeyRound,
  FileText,
} from 'lucide-react';
import { getStoredAuthSession, saveAuthSession, extractContactNumber, normalizePhMobile } from '../utils/auth';
import { STARS_API_URL } from '../config/env';
import './LoginPage.css';
import './OnboardingPage.css';

const PH_MOBILE_REGEX = /^09\d{9}$/;
const NAME_REGEX = /^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\s'\-\.]+$/;

const passwordRules = [
  { id: 'len', test: (p: string) => p.length >= 15, label: 'At least 15 characters' },
  { id: 'upper', test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter (A-Z)' },
  { id: 'lower', test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter (a-z)' },
  { id: 'num', test: (p: string) => /[0-9]/.test(p), label: 'At least one number (0-9)' },
  { id: 'special', test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Special symbol (!@#$%...)' },
];

/** Parse full name into individual name parts */
function parseFullName(fullName: string) {
  if (!fullName || !fullName.trim()) return { firstName: '', middleName: '', lastName: '', suffix: '' };
  const suffixes = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v'];
  const parts = fullName.trim().split(/\s+/);
  let suffix = '';
  if (parts.length > 2 && suffixes.includes(parts[parts.length - 1].toLowerCase())) {
    suffix = parts.pop()!;
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: '', suffix };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', lastName: parts[1], suffix };
  }
  // 3+ parts: e.g. "Juan Carlos Dela Cruz" or "Juan Santos Dela Cruz"
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, middleName: '', lastName, suffix };
}

/** Compute password strength */
function getPasswordStrength(pw: string) {
  if (!pw) return { level: 0, label: '', color: '' };
  const passed = passwordRules.filter((r) => r.test(pw)).length;
  if (passed <= 2) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (passed <= 4) return { level: 2, label: 'Fair', color: '#f59e0b' };
  return { level: 3, label: 'Strong', color: '#10b981' };
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const system = searchParams.get('system') || 'stars';
  const employeeIdParam = searchParams.get('employeeId') || searchParams.get('id') || '';
  const session = getStoredAuthSession();

  const [step, setStep] = useState<'profile' | 'password'>('profile');

  // Step 1: Profile form
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Step 2: Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // States
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedStep1, setTouchedStep1] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  // Strength & check helpers
  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Pre-fill profile based on manager registration information
  useEffect(() => {
    const empId = employeeIdParam || session?.employeeId;

    // Query params fallback (e.g. if redirected with ?phone= or ?contactNumber=)
    const urlContact =
      searchParams.get('contactNumber') ||
      searchParams.get('phoneNumber') ||
      searchParams.get('mobileNumber') ||
      searchParams.get('phone') ||
      searchParams.get('mobile') ||
      searchParams.get('contact');

    const urlFirstName = searchParams.get('firstName') || searchParams.get('first_name');
    const urlLastName = searchParams.get('lastName') || searchParams.get('last_name');

    // 1. Check navigation state from login
    const navState = (location.state as { profile?: Record<string, string> } | null)?.profile;

    // 2. Check sessionStorage
    let storedProfile: Record<string, string> | null = null;
    try {
      const raw = sessionStorage.getItem('onboarding_profile');
      if (raw) storedProfile = JSON.parse(raw);
    } catch {
      // ignore parse error
    }

    const candidate = navState || storedProfile;

    if (candidate) {
      if (candidate.firstName || (candidate as any).FirstName) {
        setFirstName(candidate.firstName || (candidate as any).FirstName);
      }
      if (candidate.middleName || (candidate as any).MiddleName) {
        setMiddleName(candidate.middleName || (candidate as any).MiddleName);
      }
      if (candidate.lastName || (candidate as any).LastName) {
        setLastName(candidate.lastName || (candidate as any).LastName);
      }
      if (candidate.suffix || (candidate as any).Suffix) {
        setSuffix(candidate.suffix || (candidate as any).Suffix);
      }

      if (!candidate.firstName && !(candidate as any).FirstName && candidate.fullName) {
        const parsed = parseFullName(candidate.fullName);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.middleName) setMiddleName(parsed.middleName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.suffix) setSuffix(parsed.suffix);
      }
      setIsPrefilled(true);
    }

    if (urlFirstName) setFirstName((prev) => prev || urlFirstName);
    if (urlLastName) setLastName((prev) => prev || urlLastName);

    // Resolve contact number from ALL possible persistent & passed sources
    const initialContact =
      extractContactNumber(candidate) ||
      extractContactNumber(urlContact) ||
      extractContactNumber(session?.contactNumber) ||
      extractContactNumber(localStorage.getItem('contactNumber')) ||
      extractContactNumber(localStorage.getItem('phoneNumber')) ||
      extractContactNumber(localStorage.getItem('mobileNumber')) ||
      extractContactNumber(localStorage.getItem('contact')) ||
      extractContactNumber(sessionStorage.getItem('contactNumber')) ||
      extractContactNumber(sessionStorage.getItem('phoneNumber')) ||
      extractContactNumber(sessionStorage.getItem('contact'));

    if (initialContact) {
      setContactNumber(initialContact);
      setIsPrefilled(true);
    }

    // 3. Probe from STARS backend APIs if employeeId or authToken is available
    if (empId || session?.authToken) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.authToken) {
        headers['Authorization'] = `Bearer ${session.authToken}`;
      }

      // Probe A: /api/profile/view-profile (Returns full profile with ContactNumber in STARS)
      if (session?.authToken && system === 'stars') {
        fetch(`${STARS_API_URL}/api/profile/view-profile`, { headers })
          .then((res) => (res.ok ? res.json() : null))
          .then((raw) => {
            const data = raw?.data || raw;
            if (data && typeof data === 'object') {
              if (data.firstName || data.FirstName) {
                setFirstName((prev) => prev || data.firstName || data.FirstName);
              }
              if (data.middleName || data.MiddleName) {
                setMiddleName((prev) => prev || data.middleName || data.MiddleName);
              }
              if (data.lastName || data.LastName) {
                setLastName((prev) => prev || data.lastName || data.LastName);
              }
              if (data.suffix || data.Suffix) {
                setSuffix((prev) => prev || data.suffix || data.Suffix);
              }

              const fetchedPhone = extractContactNumber(data);
              if (fetchedPhone) {
                setContactNumber((prev) => prev || fetchedPhone);
                saveAuthSession({ contactNumber: fetchedPhone });
              }
              setIsPrefilled(true);
            }
          })
          .catch(() => {
            // ignore
          });
      }

      // Probe B: onboarding-status
      if (empId) {
        fetch(`${STARS_API_URL}/api/Auth/onboarding-status/${encodeURIComponent(empId)}`, { headers })
          .then((res) => (res.ok ? res.json() : null))
          .then((raw) => {
            const data = raw?.data || raw;
            if (data && typeof data === 'object') {
              if (data.firstName || data.FirstName) {
                setFirstName((prev) => prev || data.firstName || data.FirstName);
              }
              if (data.middleName || data.MiddleName) {
                setMiddleName((prev) => prev || data.middleName || data.MiddleName);
              }
              if (data.lastName || data.LastName) {
                setLastName((prev) => prev || data.lastName || data.LastName);
              }
              if (data.suffix || data.Suffix) {
                setSuffix((prev) => prev || data.suffix || data.Suffix);
              }

              const fetchedPhone = extractContactNumber(data);
              if (fetchedPhone) {
                setContactNumber((prev) => prev || fetchedPhone);
              }

              if (!data.firstName && !data.FirstName && (data.fullName || data.name)) {
                const parsed = parseFullName(data.fullName || data.name);
                if (parsed.firstName) setFirstName((prev) => prev || parsed.firstName);
                if (parsed.middleName) setMiddleName((prev) => prev || parsed.middleName);
                if (parsed.lastName) setLastName((prev) => prev || parsed.lastName);
                if (parsed.suffix) setSuffix((prev) => prev || parsed.suffix);
              }
              setIsPrefilled(true);
            }
          })
          .catch(() => {
            // fallback to session employeeName if still not set
            if (session?.employeeName && session.employeeName !== 'Speedex Staff') {
              const parsed = parseFullName(session.employeeName);
              if (parsed.firstName) setFirstName((prev) => prev || parsed.firstName);
              if (parsed.lastName) setLastName((prev) => prev || parsed.lastName);
              setIsPrefilled(true);
            }
          });
      }
    } else if (session?.employeeName && session.employeeName !== 'Speedex Staff') {
      const parsed = parseFullName(session.employeeName);
      if (parsed.firstName) setFirstName((prev) => prev || parsed.firstName);
      if (parsed.lastName) setLastName((prev) => prev || parsed.lastName);
      setIsPrefilled(true);
    }
  }, [
    location.state,
    employeeIdParam,
    session?.authToken,
    session?.employeeId,
    session?.employeeName,
    session?.contactNumber,
    system,
    searchParams,
  ]);

  // Check if Step 1 is valid (all required fields filled, middleName and suffix are optional)
  const isStep1Complete =
    firstName.trim().length > 0 &&
    NAME_REGEX.test(firstName.trim()) &&
    lastName.trim().length > 0 &&
    NAME_REGEX.test(lastName.trim()) &&
    contactNumber.trim().length > 0 &&
    PH_MOBILE_REGEX.test(contactNumber.trim());

  // Validate Step 1
  const handleProfileNext = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedStep1(true);
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedContact = contactNumber.trim();

    if (!trimmedFirst) {
      setError('First name is required. Please fill in your first name.');
      return;
    }
    if (!NAME_REGEX.test(trimmedFirst)) {
      setError('Please provide a valid first name (letters, spaces, hyphens only).');
      return;
    }

    if (!trimmedLast) {
      setError('Last name is required. Please fill in your last name.');
      return;
    }
    if (!NAME_REGEX.test(trimmedLast)) {
      setError('Please provide a valid last name (letters, spaces, hyphens only).');
      return;
    }

    if (!trimmedContact) {
      setError('Mobile number is required. Please enter your 11-digit Philippine mobile number.');
      return;
    }
    if (!PH_MOBILE_REGEX.test(trimmedContact)) {
      setError('Please enter a valid 11-digit Philippine mobile number starting with 09 (e.g. 09171234567).');
      return;
    }

    setStep('password');
  };

  // Validate & Submit Step 2
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedConfirm(true);
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current temporary password assigned by your manager.');
      return;
    }

    const allRulesMet = passwordRules.every((rule) => rule.test(newPassword));
    if (!allRulesMet) {
      setError('New password does not satisfy all OWASP complexity requirements below (minimum 15 characters).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your temporary password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const empId = (employeeIdParam || session?.employeeId || '').trim();

      // Master centralized onboarding & password synchronization across all provisioned systems
      const res = await fetch(`${STARS_API_URL}/api/Auth/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeNumber: empId,
          currentPassword,
          newPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contactNumber: contactNumber.trim(),
        }),
      });

      const raw = await res.json().catch(() => null);
      if (!res.ok || (raw && raw.isSuccess === false)) {
        setError(raw?.message || 'Failed to update credentials. Please verify your current temporary password.');
        setIsSubmitting(false);
        return;
      }

      // Record profile and password completion in session
      saveAuthSession({
        employeeName: `${firstName} ${lastName}`.trim(),
        contactNumber: contactNumber.trim(),
      });

      // Clear temporary onboarding cache
      try {
        sessionStorage.removeItem('onboarding_profile');
      } catch {
        // ignore
      }

      // Navigate to Privacy Notice
      navigate(`/privacy-notice?system=${system}`);
    } catch (err) {
      console.error('Password change error:', err);
      setError('Unable to synchronize password update with the server. Please check your connection.');
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
                {step === 'profile' ? <User size={22} /> : <KeyRound size={22} />}
              </div>
              <div>
                <span className="brand-title-badge">Employee Gateway</span>
                <span className="brand-sub-badge">ACCOUNT ONBOARDING</span>
              </div>
            </div>

            <div className="login-headline">
              <h2>
                Welcome to Speedex,<br />
                <span className="headline-accent">get ready to take off.</span>
              </h2>
              <p className="headline-body">
                Complete your staff profile verification and set up a permanent, OWASP-compliant password
                to activate your enterprise access across STARS, DMS, and FOMS.
              </p>
            </div>

            {/* Step Roadmap */}
            <div className="onboarding-steps-aside">
              <div className={`aside-step-item ${step === 'profile' ? 'current' : 'done'}`}>
                <div className="aside-step-bullet">
                  {step === 'profile' ? '1' : <Check size={14} />}
                </div>
                <div className="aside-step-text">
                  <strong>Staff Profile Setup</strong>
                  <span>Verify manager-entered details and mobile contact.</span>
                </div>
              </div>

              <div className={`aside-step-item ${step === 'password' ? 'current' : ''}`}>
                <div className="aside-step-bullet">2</div>
                <div className="aside-step-text">
                  <strong>Security Password</strong>
                  <span>Establish your high-entropy personal master password.</span>
                </div>
              </div>

              <div className="aside-step-item next-up">
                <div className="aside-step-bullet">3</div>
                <div className="aside-step-text">
                  <strong>Privacy &amp; Terms</strong>
                  <span>Speedex Data Privacy Act (RA 10173) compliance sign-off.</span>
                </div>
              </div>
            </div>

            <div className="onboarding-compliance-box">
              <div className="compliance-icon-row">
                <ShieldCheck size={18} className="compliance-icon" />
                <span>Speedex Data Governance &amp; Security Compliance</span>
              </div>
              <p>
                Staff accounts are provisioned under Speedex Access Control Policies. Passwords are salted and
                hashed using PBKDF2 cryptography.
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="login-right">
          <div className="login-card onboarding-card-enhanced">
            <button
              type="button"
              className="back-to-public-btn"
              onClick={() => {
                if (step === 'password') {
                  setStep('profile');
                  setError(null);
                } else {
                  navigate('/login');
                }
              }}
              aria-label={step === 'password' ? 'Back to Profile' : 'Back to Login'}
            >
              <ArrowLeft size={14} />
              <span>{step === 'password' ? 'Back to Profile Setup' : 'Back to Login'}</span>
            </button>

            {/* Stepper Indicator */}
            <div className="onboarding-stepper" role="navigation" aria-label="Onboarding Progress">
              <div
                className={`stepper-step ${step === 'profile' ? 'active' : 'completed'}`}
                onClick={() => {
                  if (step === 'password') setStep('profile');
                }}
                style={{ cursor: step === 'password' ? 'pointer' : 'default' }}
              >
                <div className="stepper-circle">
                  {step === 'password' ? <Check size={14} /> : '1'}
                </div>
                <div className="stepper-labels">
                  <span className="step-tag">Step 1</span>
                  <span className="step-name">Profile Details</span>
                </div>
              </div>

              <div className="stepper-connector">
                <div className={`stepper-connector-line ${step === 'password' ? 'filled' : ''}`} />
              </div>

              <div className={`stepper-step ${step === 'password' ? 'active' : ''}`}>
                <div className="stepper-circle">2</div>
                <div className="stepper-labels">
                  <span className="step-tag">Step 2</span>
                  <span className="step-name">New Password</span>
                </div>
              </div>
            </div>

            {/* Card Header */}
            <div className="card-header">
              <span className="header-badge">
                {step === 'profile' ? 'STAFF VERIFICATION' : 'CREDENTIAL SETUP'}
              </span>
              <h1 className="card-title">
                {step === 'profile' ? 'Staff Profile Details' : 'Set Up New Password'}
              </h1>
              <p className="card-subtitle">
                {step === 'profile'
                  ? 'Verify your personal information. You can edit any field if corrections are required.'
                  : 'Replace your temporary password with your permanent OWASP-compliant secret.'}
              </p>
            </div>

            {/* Manager Registration Pre-fill Notice Banner */}
            {step === 'profile' && isPrefilled && (
              <div className="prefill-notice-banner" role="status">
                <div className="prefill-notice-icon">
                  <Sparkles size={16} />
                </div>
                <div className="prefill-notice-content">
                  <strong>Pre-filled from Manager Registration</strong>
                  <p>
                    Information used by your manager during account creation is pre-filled below.
                    Please review and edit any typos or incorrect details before continuing.
                  </p>
                </div>
                <div className="prefill-badge">
                  <Edit3 size={12} />
                  <span>Editable</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert-banner danger">
                <AlertCircle size={18} />
                <div>{error}</div>
              </div>
            )}

            {/* STEP 1: PROFILE SETUP FORM */}
            {step === 'profile' ? (
              <form className="login-form" onSubmit={handleProfileNext} noValidate>
                {/* First Name & Suffix in 2 columns */}
                <div className="form-row-split">
                  <div className="field-group flex-2">
                    <label className="field-label" htmlFor="first-name">
                      First Name <span className="req-star">*</span>
                    </label>
                    <div className="field-wrapper">
                      <span className="field-icon">
                        <User size={16} />
                      </span>
                      <input
                        id="first-name"
                        type="text"
                        className="field-input"
                        placeholder="e.g. Juan"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group flex-1">
                    <label className="field-label" htmlFor="suffix">
                      Suffix <span className="opt-tag">(Optional)</span>
                    </label>
                    <div className="field-wrapper">
                      <input
                        id="suffix"
                        type="text"
                        className="field-input no-left-icon"
                        placeholder="e.g. Jr., III"
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                        autoComplete="honorific-suffix"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Name */}
                <div className="field-group">
                  <label className="field-label" htmlFor="middle-name">
                    Middle Name <span className="opt-tag">(Optional)</span>
                  </label>
                  <div className="field-wrapper">
                    <span className="field-icon">
                      <User size={16} />
                    </span>
                    <input
                      id="middle-name"
                      type="text"
                      className="field-input"
                      placeholder="e.g. Santos"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      autoComplete="additional-name"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="field-group">
                  <label className="field-label" htmlFor="last-name">
                    Last Name <span className="req-star">*</span>
                  </label>
                  <div className="field-wrapper">
                    <span className="field-icon">
                      <User size={16} />
                    </span>
                    <input
                      id="last-name"
                      type="text"
                      className="field-input"
                      placeholder="e.g. Dela Cruz"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>

                {/* Philippine Mobile Number */}
                <div className="field-group">
                  <label className="field-label" htmlFor="contact-number">
                    Mobile Number <span className="req-star">*</span>
                  </label>
                  <div className="field-wrapper">
                    <span className="field-icon">
                      <Phone size={16} />
                    </span>
                    <input
                      id="contact-number"
                      type="tel"
                      className="field-input"
                      placeholder="09XXXXXXXXX (11 digits)"
                      value={contactNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setContactNumber(digits);
                      }}
                      maxLength={11}
                      autoComplete="tel"
                      required
                    />
                    {contactNumber && PH_MOBILE_REGEX.test(contactNumber) && (
                      <span className="field-valid-icon" title="Valid Philippine Mobile Number">
                        <CheckCircle2 size={16} />
                      </span>
                    )}
                  </div>
                  <span className="field-helper-hint">
                    Format: 11-digit Philippine mobile number starting with 09 (e.g. 09171234567)
                  </span>
                </div>

                {/* Continue to Step 2 Button */}
                <button
                  type="submit"
                  className="submit-btn onboarding-submit-btn"
                  disabled={!isStep1Complete}
                  title={!isStep1Complete ? 'Please fill in all required fields (First Name, Last Name, Mobile Number) before proceeding' : undefined}
                >
                  <span>Next: Password Setup</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              /* STEP 2: SET UP NEW PASSWORD FORM */
              <form className="login-form" onSubmit={handlePasswordSubmit} noValidate>
                {/* Temporary Password */}
                <div className="field-group">
                  <label className="field-label" htmlFor="current-password">
                    Current Temporary Password <span className="req-star">*</span>
                  </label>
                  <div className="field-wrapper">
                    <span className="field-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      id="current-password"
                      type={showCurrent ? 'text' : 'password'}
                      className="field-input"
                      placeholder="Enter temporary password assigned by manager"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      onClick={() => setShowCurrent(!showCurrent)}
                      tabIndex={-1}
                      aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="field-helper-hint">
                    Check your onboarding email or notification from your system manager for this password.
                  </span>
                </div>

                {/* New Password */}
                <div className="field-group">
                  <label className="field-label" htmlFor="new-password">
                    New Password (Min 15 Characters) <span className="req-star">*</span>
                  </label>
                  <div className="field-wrapper">
                    <span className="field-icon">
                      <KeyRound size={16} />
                    </span>
                    <input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      className="field-input"
                      placeholder="Create high-entropy password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                {/* Confirm New Password */}
                <div className="field-group">
                  <label className="field-label" htmlFor="confirm-password">
                    Confirm New Password <span className="req-star">*</span>
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

                {/* Live OWASP Complexity Requirements Checklist */}
                <div className="pw-checklist-card">
                  <span className="checklist-title">OWASP Password Requirements:</span>
                  <ul className="checklist-items">
                    {passwordRules.map((rule) => {
                      const isValid = rule.test(newPassword);
                      return (
                        <li key={rule.id} className={isValid ? 'met' : 'unmet'}>
                          {isValid ? <Check size={14} /> : <X size={14} />}
                          <span>{rule.label}</span>
                        </li>
                      );
                    })}
                    <li className={passwordsMatch ? 'met' : 'unmet'}>
                      {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                      <span>Passwords match</span>
                    </li>
                  </ul>
                </div>

                {/* Actions: Back & Save */}
                <div className="step-actions-row">
                  <button
                    type="button"
                    className="step-back-btn"
                    onClick={() => {
                      setStep('profile');
                      setError(null);
                    }}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="submit-btn onboarding-submit-btn flex-1"
                    disabled={
                      isSubmitting ||
                      !currentPassword ||
                      !passwordRules.every((r) => r.test(newPassword)) ||
                      !passwordsMatch
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="spinner" />
                        <span>Updating Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Password &amp; Continue</span>
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            </div>
        </main>
      </div>
    </div>
  );
}
