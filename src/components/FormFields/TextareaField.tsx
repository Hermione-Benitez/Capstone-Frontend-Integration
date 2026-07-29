import React, { useState, useId } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import './FormFields.css';

export interface TextareaFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  rows?: number;
  maxWords?: number;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  state = 'default',
  message,
  rows = 4,
  maxWords,
  required = false,
  disabled = false,
  id: customId,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const reactId = useId();
  const areaId  = customId || reactId;
  const hintId  = `${areaId}-hint`;

  let computedState = disabled ? 'disabled' : state;
  if (!disabled && isFocused) {
    if (state === 'error') computedState = 'error';
    else if (state === 'default') computedState = 'focused';
  }

  const isError   = computedState === 'error';
  const isSuccess = computedState === 'success';
  const hasHint   = !!message;

  const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
  const atLimit   = !!maxWords && wordCount >= maxWords;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!maxWords) { onChange && onChange(e); return; }
    const raw   = e.target.value;
    const words = raw.trim() === '' ? [] : raw.trim().split(/\s+/);
    if (words.length <= maxWords) {
      onChange && onChange(e);
    } else {
      // clamp — fire synthetic event with clamped value
      const clamped = words.slice(0, maxWords).join(' ');
      const synth   = { ...e, target: { ...e.target, value: clamped } } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange && onChange(synth);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`tf-group state-${computedState}`}>
      <div className="tf-label-row">
        <label className="tf-label" htmlFor={areaId}>
          {label}
          {required && <span className="tf-label-required"> *</span>}
        </label>
        {maxWords && (
          <span className={`tf-word-count${atLimit ? ' tf-word-count--limit' : ''}`}>
            {wordCount} / {maxWords} words
          </span>
        )}
      </div>
      <div className="tf-wrapper tf-textarea-wrapper">
        <textarea
          id={areaId}
          className="tf-textarea"
          placeholder={placeholder}
          value={value}
          rows={rows}
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint || atLimit ? hintId : undefined}
        />
      </div>
      {atLimit && (
        <span className="tf-hint tf-hint--limit" id={hintId}>
          <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          {maxWords}-word limit reached.
        </span>
      )}
      {!atLimit && hasHint && (
        <span className="tf-hint" id={hintId}>
          {isError   && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {isSuccess && <CheckCircle2  size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {message}
        </span>
      )}
    </div>
  );
};

export default TextareaField;
