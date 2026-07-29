import React, { useState, useId } from 'react';
import { AlertTriangle, CheckCircle2, Phone } from 'lucide-react';
import './FormFields.css';

export interface PhoneFieldProps {
  label: string;
  value: string;                              // raw: "09XXXXXXXXX"
  onChange?: (raw: string) => void;           // always raw 11-digit
  onFocus?: () => void;
  onBlur?: () => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled' | 'error-focused';
  message?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

/** Format raw 09XXXXXXXXX  →  +63 9XX XXX XXXX */
function formatPH(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  // Remove leading 0 to get the 10-digit national number
  const nat = digits.startsWith('0') ? digits.slice(1) : digits;
  // nat = 9XXXXXXXXX (up to 10 chars)
  const p1 = nat.slice(0, 3);   // 9XX
  const p2 = nat.slice(3, 6);   // XXX
  const p3 = nat.slice(6, 10);  // XXXX
  let display = '+63';
  if (p1) display += ' ' + p1;
  if (p2) display += ' ' + p2;
  if (p3) display += ' ' + p3;
  return display;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  state = 'default',
  message,
  required = false,
  disabled = false,
  id: customId,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const reactId = useId();
  const inputId = customId || reactId;
  const hintId  = `${inputId}-hint`;

  let computedState = disabled ? 'disabled' : state;
  if (!disabled && isFocused) {
    if (state === 'error') computedState = 'error-focused';
    else if (state === 'default') computedState = 'focused';
  }

  const isError   = computedState === 'error' || computedState === 'error-focused';
  const isSuccess = computedState === 'success';
  const hasHint   = !!message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract only digits from what the user typed
    const typed  = e.target.value;
    // Strip +63, spaces, dashes — keep only digit chars
    const digits = typed.replace(/\D/g, '').slice(0, 11);
    // Ensure starts with 0
    const raw = digits.startsWith('0') ? digits : (digits.length ? '0' + digits : '');
    onChange && onChange(raw.slice(0, 11));
  };

  const handleFocus = () => { setIsFocused(true); onFocus && onFocus(); };
  const handleBlur  = () => { setIsFocused(false); onBlur && onBlur(); };

  return (
    <div className={`tf-group state-${computedState}`}>
      <label className="tf-label" htmlFor={inputId}>
        {label}
        {required && <span className="tf-label-required"> *</span>}
      </label>
      <div className="tf-wrapper">
        <span className="tf-phone-prefix">
          <Phone size={13} strokeWidth={2} />
        </span>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          value={formatPH(value)}
          placeholder="+63 9XX XXX XXXX"
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="tf-input tf-phone-input"
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint ? hintId : undefined}
        />
        {isSuccess && (
          <span className="tf-status-icon">
            <CheckCircle2 size={15} strokeWidth={2} />
          </span>
        )}
        {isError && (
          <span className="tf-status-icon">
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      {hasHint && (
        <span className="tf-hint" id={hintId}>
          {isError   && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {isSuccess && <CheckCircle2  size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {message}
        </span>
      )}
    </div>
  );
};

export default PhoneField;
