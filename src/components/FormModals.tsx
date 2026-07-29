import React, { useState, useId, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  PlusCircle,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';
import { TextField } from './FormFields/TextField';
import { CalendarPicker } from './FormFields/CalendarPicker';
import { SelectField } from './FormFields/SelectField';
import { TextareaField } from './FormFields/TextareaField';
import { PhoneField } from './FormFields/PhoneField';
// FormModals.css still imported here for modal-specific styles
import './FormModals.css';

// ─────────────────────────────────────────────────────────────────
// Re-export form field components so existing imports still work
// ─────────────────────────────────────────────────────────────────
export { TextField } from './FormFields/TextField';
export type { TextFieldProps } from './FormFields/TextField';
export { CalendarPicker } from './FormFields/CalendarPicker';
export type { CalendarPickerProps } from './FormFields/CalendarPicker';
export type { DayDisabledOpts } from './FormFields/calendarHelpers';
export { CalendarRangePicker } from './FormFields/CalendarRangePicker';
export type { CalendarRangePickerProps } from './FormFields/CalendarRangePicker';
export { SelectField } from './FormFields/SelectField';
export type { SelectFieldProps } from './FormFields/SelectField';
export { TextareaField } from './FormFields/TextareaField';
export type { TextareaFieldProps } from './FormFields/TextareaField';
export { PhoneField } from './FormFields/PhoneField';
export type { PhoneFieldProps } from './FormFields/PhoneField';

// ─────────────────────────────────────────────────────────────────
// Toast (local to FormModals demo only)
// ─────────────────────────────────────────────────────────────────
export interface ToastInfo {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'error';
  leaving?: boolean;
}

const TOAST_LIFETIME_MS = 3000;
const TOAST_EXIT_MS     = 200;

// ─────────────────────────────────────────────────────────────────
// Validation messages
// ─────────────────────────────────────────────────────────────────
export const VALIDATION_MESSAGES = {
  required:      "This field is required.",
  nameMin:       "Name must be at least 3 characters long.",
  invalidEmail:  "Please enter a valid email format.",
  phoneDigits:   "Must be exactly 11 digits (09XXXXXXXXX).",
  phoneFormat:   "Enter a valid Philippine mobile number.",
  reasonMin:     "Notes must be at least 10 characters long.",
};

// ─────────────────────────────────────────────────────────────────
// FormModals — Demo / Showcase component
// ─────────────────────────────────────────────────────────────────
export const FormModals: React.FC = () => {
  const textareaId = useId();

  /* ── Modal visibility ── */
  const [isCreateModalOpen,       setIsCreateModalOpen]       = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  /* ── Closing animation flags ── */
  const [isCreateModalClosing,       setIsCreateModalClosing]       = useState(false);
  const [isVerificationModalClosing, setIsVerificationModalClosing] = useState(false);
  const [isSuccessPopupClosing,      setIsSuccessPopupClosing]      = useState(false);

  /* ── Success popup ── */
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [createdRecord, setCreatedRecord] = useState<{
    name: string; category: string; email: string; phone: string; date: string; reason: string;
  } | null>(null);

  /* ── Verification ── */
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const REQUIRED_PASSCODE = 'LOCK-USER';

  /* ── Form fields ── */
  const [recordName,     setRecordName]     = useState('');
  const [recordCategory, setRecordCategory] = useState('Primary');
  const [recordEmail,    setRecordEmail]    = useState('');
  const [recordPhone,    setRecordPhone]    = useState('');
  const [recordDate,     setRecordDate]     = useState('');
  const [recordReason,   setRecordReason]   = useState('');
  const [formSubmitted,  setFormSubmitted]  = useState(false);
  const [touchedFields,  setTouchedFields]  = useState<Record<string, boolean>>({});

  /* ── Toasts ── */
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  /* ── External open event ── */
  useEffect(() => {
    const handler = () => setIsCreateModalOpen(true);
    window.addEventListener('open-create-record-modal', handler);
    return () => window.removeEventListener('open-create-record-modal', handler);
  }, []);

  /* ── Close helpers ── */
  const closeCreateModal = () => {
    setIsCreateModalClosing(true);
    setTimeout(() => {
      setIsCreateModalOpen(false);
      setIsCreateModalClosing(false);
      setTouchedFields({});
    }, TOAST_EXIT_MS);
  };
  const closeVerificationModal = () => {
    setIsVerificationModalClosing(true);
    setTimeout(() => { setIsVerificationModalOpen(false); setIsVerificationModalClosing(false); }, TOAST_EXIT_MS);
  };
  const closeSuccessPopup = () => {
    setIsSuccessPopupClosing(true);
    setTimeout(() => { setShowSuccessPopup(false); setCreatedRecord(null); setIsSuccessPopupClosing(false); }, TOAST_EXIT_MS);
  };

  const addToast = (title: string, description: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t)), TOAST_LIFETIME_MS - TOAST_EXIT_MS);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_LIFETIME_MS);
  };

  /* ── Validation helpers ── */
  const getNameState  = (v: string) => !v ? 'default' : v.trim().length >= 3 ? 'success' : 'error';
  const getEmailState = (v: string) => !v ? 'default' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'success' : 'error';
  const getPhoneState = (v: string) => !v ? 'default' : /^\d{11}$/.test(v) ? 'success' : 'error';
  const getDateState  = (v: string) => !v ? 'default' : 'success';
  const getReasonState= (v: string) => !v ? 'default' : v.trim().length >= 10 ? 'success' : 'error';

  /* ── Form submit ── */
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const ok =
      getNameState(recordName) === 'success' &&
      getEmailState(recordEmail) === 'success' &&
      getPhoneState(recordPhone) === 'success' &&
      getDateState(recordDate) === 'success' &&
      getReasonState(recordReason) === 'success';

    if (ok) {
      setCreatedRecord({ name: recordName, category: recordCategory, email: recordEmail, phone: recordPhone, date: recordDate, reason: recordReason });
      setShowSuccessPopup(true);
      addToast('Record Created Successfully', `"${recordName}" has been added to the directory.`);
      setRecordName(''); setRecordCategory('Primary'); setRecordEmail('');
      setRecordPhone(''); setRecordDate(''); setRecordReason('');
      setFormSubmitted(false);
      closeCreateModal();
    } else {
      addToast('Validation Failed', 'Please correct all highlighted error fields.', 'error');
    }
  };

  /* ── Lock confirm ── */
  const handleLockConfirm = () => {
    if (confirmPasscode === REQUIRED_PASSCODE) {
      addToast('Profile Security Status: Locked', 'Profile has been restricted successfully.');
      setConfirmPasscode('');
      closeVerificationModal();
    }
  };

  return (
    <div className="fm-section">

      {/* ── Trigger cards ── */}
      <div className="fm-trigger-grid">
        <div className="fm-trigger-card">
          <button
            id="btn-open-create-modal"
            className="btn btn--primary fm-trigger-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusCircle size={15} strokeWidth={2} />
            Open Form Modal
          </button>
        </div>

        <div className="fm-trigger-card">
          <button
            id="btn-open-lock-modal"
            className="btn btn--danger fm-trigger-btn"
            onClick={() => setIsVerificationModalOpen(true)}
          >
            <Lock size={15} strokeWidth={2} />
            Lock Profile
          </button>
        </div>
      </div>

      {/* MODAL 1 — CREATE RECORD FORM */}
      {isCreateModalOpen && (
        <div
          className={`modal-overlay${isCreateModalClosing ? ' closing' : ''}`}
          onClick={closeCreateModal}
        >
          <div
            className={`modal-card${isCreateModalClosing ? ' closing' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-hd">
              <div className="modal-hd-left">
                <span className="modal-hd-icon">
                  <ClipboardList size={18} strokeWidth={2} />
                </span>
                <h2 className="modal-hd-title">Create New Record</h2>
              </div>
              <button className="modal-x-btn" onClick={closeCreateModal} aria-label="Close">
                <X size={17} strokeWidth={2.5} />
              </button>
            </div>
            <div className="modal-hd-divider" />

            {/* Body */}
            <form onSubmit={handleFormSubmit}>
              <div className="modal-bd">

                {/* Row 1: Name + Category */}
                <div className="modal-row-2">
                  <TextField
                    label="RECORD NAME"
                    placeholder="Enter full name or title..."
                    value={recordName}
                    onChange={e => {
                      setRecordName(e.target.value);
                      setTouchedFields(prev => ({ ...prev, name: true }));
                    }}
                    state={
                      (formSubmitted || touchedFields.name)
                        ? (!recordName.trim() ? 'error' : getNameState(recordName) as any)
                        : 'default'
                    }
                    required={true}
                    message={
                      (formSubmitted || touchedFields.name)
                        ? (!recordName.trim()
                          ? VALIDATION_MESSAGES.required
                          : getNameState(recordName) === 'error'
                          ? VALIDATION_MESSAGES.nameMin
                          : '')
                        : ''
                    }
                  />
                  <SelectField
                    label="CATEGORY"
                    id="record-category-select"
                    value={recordCategory}
                    options={[
                      { value: 'Primary',        label: 'Primary' },
                      { value: 'Secondary',      label: 'Secondary' },
                      { value: 'Utility',        label: 'Utility' },
                      { value: 'Administrative', label: 'Administrative' },
                    ]}
                    onChange={val => setRecordCategory(val)}
                    state="default"
                  />
                </div>

                {/* Row 2: Email + Phone */}
                <div className="modal-row-2">
                  <TextField
                    label="EMAIL ADDRESS"
                    placeholder="name@domain.com"
                    value={recordEmail}
                    onChange={e => {
                      setRecordEmail(e.target.value);
                      setTouchedFields(prev => ({ ...prev, email: true }));
                    }}
                    state={
                      (formSubmitted || touchedFields.email)
                        ? (!recordEmail.trim() ? 'error' : getEmailState(recordEmail) as any)
                        : 'default'
                    }
                    required={true}
                    message={
                      (formSubmitted || touchedFields.email)
                        ? (!recordEmail.trim()
                          ? VALIDATION_MESSAGES.required
                          : getEmailState(recordEmail) === 'error'
                          ? VALIDATION_MESSAGES.invalidEmail
                          : '')
                        : ''
                    }
                  />
                  <PhoneField
                    label="PHONE NUMBER"
                    value={recordPhone}
                    required={true}
                    onChange={raw => {
                      setRecordPhone(raw);
                      setTouchedFields(prev => ({ ...prev, phone: true }));
                    }}
                    state={
                      (formSubmitted || touchedFields.phone)
                        ? (!recordPhone.trim() ? 'error' : getPhoneState(recordPhone) as any)
                        : 'default'
                    }
                    message={
                      (formSubmitted || touchedFields.phone)
                        ? (!recordPhone.trim()
                          ? VALIDATION_MESSAGES.required
                          : getPhoneState(recordPhone) === 'error'
                          ? VALIDATION_MESSAGES.phoneDigits
                          : '')
                        : ''
                    }
                  />
                </div>

                {/* Row 3: Date (half-width) */}
                <div className="modal-row-half">
                  <CalendarPicker
                    label="TARGET DATE"
                    placeholder="Select date..."
                    value={recordDate}
                    onChange={date => {
                      setRecordDate(date);
                      setTouchedFields(prev => ({ ...prev, date: true }));
                    }}
                    disablePastDates={true}
                    state={
                      (formSubmitted || touchedFields.date)
                        ? (!recordDate ? 'error' : 'success')
                        : 'default'
                    }
                    required={true}
                    message={(formSubmitted || touchedFields.date) && !recordDate ? VALIDATION_MESSAGES.required : ''}
                  />
                </div>

                {/* Row 4: Notes */}
                <TextareaField
                  label="NOTES"
                  id={textareaId}
                  placeholder="Write notes for this record entry..."
                  value={recordReason}
                  rows={4}
                  maxWords={250}
                  required={true}
                  onChange={e => {
                    setRecordReason(e.target.value);
                    setTouchedFields(prev => ({ ...prev, reason: true }));
                  }}
                  state={
                    (formSubmitted || touchedFields.reason)
                      ? (!recordReason.trim() ? 'error' : getReasonState(recordReason) as any)
                      : 'default'
                  }
                  message={
                    (formSubmitted || touchedFields.reason)
                      ? (!recordReason.trim()
                        ? VALIDATION_MESSAGES.required
                        : getReasonState(recordReason) === 'error'
                        ? VALIDATION_MESSAGES.reasonMin
                        : '')
                      : ''
                  }
                />

              </div>

              {/* Footer */}
              <div className="modal-ft-divider" />
              <div className="modal-ft">
                <button type="button" className="btn btn--outline" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary modal-ft-action">
                  SAVE RECORD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 — DOUBLE-FACTOR VERIFICATION */}
      {isVerificationModalOpen && (
        <div
          className={`modal-overlay${isVerificationModalClosing ? ' closing' : ''}`}
          onClick={closeVerificationModal}
        >
          <div
            className={`modal-card verification-modal${isVerificationModalClosing ? ' closing' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-hd">
              <div className="modal-hd-left">
                <span className="modal-hd-icon modal-hd-icon--danger">
                  <ShieldAlert size={18} strokeWidth={2} />
                </span>
                <h2 className="modal-hd-title modal-hd-title--danger">Verification Security Check</h2>
              </div>
              <button className="modal-x-btn" onClick={closeVerificationModal} aria-label="Close">
                <X size={17} strokeWidth={2.5} />
              </button>
            </div>
            <div className="modal-hd-divider" />

            <div className="modal-bd">
              <div className="verification-warning-container">
                <AlertTriangle size={19} className="warning-icon" strokeWidth={2} />
                <p className="warning-text">
                  You are locking profile permissions on{' '}
                  <strong>FirstName LastName (Logistics Director)</strong>. This restricts system
                  access controls immediately.
                </p>
              </div>

              <div style={{ marginTop: '8px' }}>
                <p className="passcode-check-label">
                  To confirm, type the verification code:
                  <span className="passcode-text-display">{REQUIRED_PASSCODE}</span>
                </p>
                <TextField
                  label="PASSCODE CONFIRMATION"
                  placeholder="Type signature passcode..."
                  value={confirmPasscode}
                  onChange={e => setConfirmPasscode(e.target.value)}
                  required={true}
                  state={
                    confirmPasscode === REQUIRED_PASSCODE ? 'success'
                    : confirmPasscode ? 'error'
                    : 'default'
                  }
                  message={
                    confirmPasscode && confirmPasscode !== REQUIRED_PASSCODE
                      ? 'Passcode mismatch. Enter the exact code listed above.'
                      : ''
                  }
                />
              </div>
            </div>

            <div className="modal-ft-divider" />
            <div className="modal-ft">
              <button type="button" className="btn btn--outline" onClick={closeVerificationModal}>
                Cancel Action
              </button>
              <button
                type="button"
                className="btn btn--danger modal-ft-action"
                disabled={confirmPasscode !== REQUIRED_PASSCODE}
                onClick={handleLockConfirm}
              >
                LOCK PROFILE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 — SUCCESS POPUP */}
      {showSuccessPopup && createdRecord && (
        <div className={`modal-overlay${isSuccessPopupClosing ? ' closing' : ''}`}>
          <div
            className={`modal-card success-popup${isSuccessPopupClosing ? ' closing' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="success-popup-icon">
              <CheckCircle2 size={38} strokeWidth={1.5} />
            </div>
            <h2 className="modal-hd-title success-popup-title">Record Created Successfully!</h2>
            <p className="fm-page-desc" style={{ marginBottom: 20, textAlign: 'center' }}>
              The record has been validated and committed to the directory.
            </p>

            <div className="success-detail-card">
              {[
                { k: 'Name',        v: createdRecord.name },
                { k: 'Category',    v: createdRecord.category, badge: true },
                { k: 'Email',       v: createdRecord.email },
                { k: 'Phone',       v: createdRecord.phone },
                { k: 'Target Date', v: createdRecord.date },
                { k: 'Reason',      v: createdRecord.reason },
              ].map(row => (
                <div key={row.k} className="success-detail-row">
                  <span className="success-detail-key">{row.k}</span>
                  {row.badge
                    ? <span className="success-detail-badge">{row.v}</span>
                    : <span className="success-detail-val">{row.v}</span>
                  }
                </div>
              ))}
            </div>

            <button
              className="btn btn--primary"
              style={{ width: '100%', padding: '11px', letterSpacing: '0.5px' }}
              onClick={closeSuccessPopup}
            >
              CONFIRM &amp; CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast${toast.type === 'error' ? ' toast-error' : ''}${toast.leaving ? ' leaving' : ''}`}>
            <div className={`toast-icon ${toast.type}`}>
              {toast.type === 'success'
                ? <CheckCircle2 size={19} strokeWidth={2} />
                : <AlertTriangle size={19} strokeWidth={2} />}
            </div>
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              <p className="toast-desc">{toast.description}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FormModals;
