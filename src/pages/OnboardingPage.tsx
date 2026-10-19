import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { getStoredAuthSession, saveAuthSession } from '../utils/auth';
import { STARS_API_URL, DMS_API_URL } from '../config/env';
import './OnboardingPage.css';

const PH_MOBILE_REGEX = /^09\d{9}$/;
const NAME_REGEX = /^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\s'\-\.]+$/;

const passwordRules = [
  { test: (p: string) => p.length >= 15, label: 'At least 15 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'At least one number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Special symbol (!@#$%...)' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
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

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate Step 1
  const handleProfileNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !NAME_REGEX.test(firstName.trim())) {
      setError('Please provide a valid first name.');
      return;
    }
    if (!lastName.trim() || !NAME_REGEX.test(lastName.trim())) {
      setError('Please provide a valid last name.');
      return;
    }
    if (!PH_MOBILE_REGEX.test(contactNumber.trim())) {
      setError('Please enter an 11-digit Philippine mobile number starting with 09 (e.g. 09171234567).');
      return;
    }

    setStep('password');
  };

  // Validate & Submit Step 2
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current temporary password.');
      return;
    }

    const allRulesMet = passwordRules.every((rule) => rule.test(newPassword));
    if (!allRulesMet) {
      setError('New password does not satisfy all OWASP complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
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
        setError(raw?.message || 'Failed to update password. Please check your current temporary password.');
        setIsSubmitting(false);
        return;
      }

      // Record profile and password completion in session
      saveAuthSession({
        employeeName: `${firstName} ${lastName}`.trim(),
      });

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
    <div className="onboarding-root">
      <div className="onboarding-card">
        <header className="onboarding-header">
          <div className="step-indicator">
            <div className={`step-node ${step === 'profile' ? 'active' : 'completed'}`}>
              <div className="step-number">{step === 'profile' ? '1' : <Check size={14} />}</div>
              <span>Profile Setup</span>
            </div>
            <div className="step-divider" />
            <div className={`step-node ${step === 'password' ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Security Password</span>
            </div>
          </div>
          <h1 className="brand-title">Account Onboarding</h1>
          <p className="brand-subtitle">
            {step === 'profile'
              ? 'Complete your staff profile verification'
              : 'Create a secure OWASP-compliant password'}
          </p>
        </header>

        {error && (
          <div className="alert-banner danger">
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        {step === 'profile' ? (
          <form className="login-form" onSubmit={handleProfileNext}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={18} /></span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Middle Name (Optional)</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={18} /></span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Santos"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={18} /></span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dela Cruz"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Suffix (Optional)</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={18} /></span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jr., III"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <div className="input-wrapper">
                <span className="input-icon"><Phone size={18} /></span>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="09XXXXXXXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  maxLength={11}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              <span>Next: Password Setup</span>
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Temporary Password *</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={18} /></span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter temporary password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password (Min 15 Characters) *</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={18} /></span>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Create secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password complexity checklist */}
              <div className="rules-grid">
                {passwordRules.map((rule, idx) => {
                  const isValid = rule.test(newPassword);
                  return (
                    <div key={idx} className={`rule-item ${isValid ? 'valid' : ''}`}>
                      {isValid ? <Check size={14} /> : <X size={14} />}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={18} /></span>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
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
          </form>
        )}
      </div>
    </div>
  );
}
