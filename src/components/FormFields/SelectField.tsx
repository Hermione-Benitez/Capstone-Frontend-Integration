import React, { useState, useId } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import './FormFields.css';

export interface SelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
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
  const selectId = customId || reactId;
  const hintId = `${selectId}-hint`;

  let computedState = disabled ? 'disabled' : state;
  if (!disabled && isFocused && state !== 'error') computedState = 'focused';
  if (!disabled && isFocused && state === 'error') computedState = 'error';

  const isError   = computedState === 'error';
  const isSuccess = computedState === 'success';
  const hasHint   = !!message;

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`tf-group state-${computedState}`}>
      <label className="tf-label" htmlFor={selectId}>
        {label}
        {required && <span className="tf-label-required"> *</span>}
      </label>
      <div className="tf-wrapper tf-select-wrapper">
        <select
          id={selectId}
          className="tf-select"
          value={value}
          disabled={disabled}
          onChange={e => onChange && onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint ? hintId : undefined}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {isSuccess && (
          <span className="tf-status-icon tf-status-icon--select">
            <CheckCircle2 size={15} strokeWidth={2} />
          </span>
        )}
        {isError && (
          <span className="tf-status-icon tf-status-icon--select">
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
        )}
        {!isSuccess && !isError && (
          <span className="tf-select-caret">
            <ChevronDown size={14} strokeWidth={2.5} />
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

export default SelectField;
