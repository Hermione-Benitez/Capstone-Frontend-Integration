import React, { useState, useId } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import './FormFields.css';

export interface TextFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled' | 'hover' | 'error-focused';
  message?: string;
  type?: string;
  readOnly?: boolean;
  disabled?: boolean;
  maxLength?: number;
  required?: boolean;
  id?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  state = 'default',
  message,
  type = 'text',
  readOnly = false,
  disabled = false,
  maxLength,
  required = false,
  id: customId,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const reactId = useId();
  const inputId = customId || reactId;
  const hintId = `${inputId}-hint`;

  let computedState = state;
  if (disabled) {
    computedState = 'disabled';
  } else if (isFocused) {
    if (state === 'error') computedState = 'error-focused';
    else if (state === 'default') computedState = 'focused';
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const isError = computedState === 'error' || computedState === 'error-focused';
  const hasHint = !!message;

  return (
    <div className={`tf-group state-${computedState}`}>
      <label className="tf-label" htmlFor={inputId}>
        {label}
        {required && <span className="tf-label-required"> *</span>}
      </label>
      <div className="tf-wrapper">
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={readOnly}
          disabled={disabled}
          maxLength={maxLength}
          className="tf-input"
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint ? hintId : undefined}
        />

        {computedState === 'success' && (
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
          {isError && (
            <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          )}
          {computedState === 'success' && (
            <CheckCircle2 size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          )}
          {message}
        </span>
      )}
    </div>
  );
};

export default TextField;
