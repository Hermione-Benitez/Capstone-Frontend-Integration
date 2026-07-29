import React, { useState, useRef, useEffect, useId } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  isoToDate,
  toIso,
  getMonthNames,
  getMonthShortNames,
  getWeekdayLabels,
  isDayDisabled,
  type DayDisabledOpts,
} from './calendarHelpers';
import './FormFields.css';

export interface CalendarPickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  /** @deprecated Use minDate="YYYY-MM-DD" instead. Kept for backwards compat. */
  disablePastDates?: boolean;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  /** BCP-47 locale tag — defaults to browser language. */
  locale?: string;
  compact?: boolean;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  label,
  value,
  onChange,
  state = 'default',
  message,
  placeholder = 'Select date...',
  required = false,
  id: customId,
  disablePastDates = false,
  minDate,
  maxDate,
  disabledDates,
  locale,
  compact = false,
}) => {
  const effectiveLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [showJumpPanel, setShowJumpPanel] = useState(false);
  const [jumpYear, setJumpYear] = useState(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const reactId = useId();
  const pickerId = customId || reactId;
  const hintId = `${pickerId}-hint`;

  const disabledOpts: DayDisabledOpts = { minDate, maxDate, disabledDates, disablePastDates };

  // Sync calendar view when value changes externally
  useEffect(() => {
    if (value) {
      const p = isoToDate(value);
      if (!isNaN(p.getTime())) setCurrentDate(p);
    }
  }, [value]);

  // Sync jump panel year when popover opens
  useEffect(() => {
    if (isOpen) setJumpYear(year);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowJumpPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const navMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
    setFocusedDay(null);
  };

  const handleDaySelect = (day: number) => {
    if (isDayDisabled(day, year, month, disabledOpts)) return;
    onChange(toIso(year, month, day));
    setIsOpen(false);
    setShowJumpPanel(false);
    setFocusedDay(null);
  };

  // ── Keyboard navigation (ARIA grid pattern) ──
  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cur = focusedDay ?? (value ? isoToDate(value).getDate() : 1);

    if (e.key === 'Escape')   { e.preventDefault(); setIsOpen(false); return; }
    if (e.key === 'PageUp')   { e.preventDefault(); navMonth(-1); return; }
    if (e.key === 'PageDown') { e.preventDefault(); navMonth(1);  return; }

    let next = cur;
    if      (e.key === 'ArrowRight') { e.preventDefault(); next = cur + 1; }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); next = cur - 1; }
    else if (e.key === 'ArrowDown')  { e.preventDefault(); next = cur + 7; }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); next = cur - 7; }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDaySelect(cur);
      return;
    } else return;

    next = Math.max(1, Math.min(totalDays, next));
    setFocusedDay(next);
    setTimeout(() => dayRefs.current.get(next)?.focus(), 0);
  };

  // Build day grid
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysArray: Array<number | null> = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= totalDays; i++) daysArray.push(i);

  const monthNames = getMonthNames(effectiveLocale);
  const monthShortNames = getMonthShortNames(effectiveLocale);
  const weekdayLabels = getWeekdayLabels(effectiveLocale);

  const formattedValue = value
    ? new Intl.DateTimeFormat(effectiveLocale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
        isoToDate(value)
      )
    : '';

  const computedState = isOpen ? 'focused' : state;
  const isError = computedState === 'error';
  const hasHint = !!message;

  const selDate = value ? isoToDate(value) : null;

  return (
    <div className={`tf-group state-${computedState}${compact ? ' tf-group--compact' : ''}`} ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label className="tf-label" htmlFor={pickerId}>
          {label}
          {required && <span className="tf-label-required"> *</span>}
        </label>
      )}
      <div
        className="tf-wrapper tf-calendar-trigger"
        onClick={() => state !== 'disabled' && setIsOpen(!isOpen)}
      >
        <span className="tf-cal-icon"><CalendarIcon size={15} strokeWidth={2} /></span>
        <input
          id={pickerId}
          type="text"
          value={formattedValue}
          placeholder={placeholder}
          readOnly
          className="tf-input tf-cal-input"
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint ? hintId : undefined}
          aria-haspopup="grid"
          aria-expanded={isOpen}
        />
      </div>

      {hasHint && (
        <span className="tf-hint" id={hintId}>
          {isError && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {state === 'success' && <CheckCircle2 size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {message}
        </span>
      )}

      {isOpen && (
        <div className="cal-popover" role="dialog" aria-label={`${label} calendar`}>

          {/* ── Year/Month Jump Panel ── */}
          {showJumpPanel && (
            <div className="cal-jump-panel">
              <div className="cal-jump-year">
                <button type="button" className="cal-nav-btn" onClick={() => setJumpYear(y => y - 1)} aria-label="Previous year">
                  <ChevronLeft size={13} />
                </button>
                <span className="cal-jump-year-label">{jumpYear}</span>
                <button type="button" className="cal-nav-btn" onClick={() => setJumpYear(y => y + 1)} aria-label="Next year">
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className="cal-jump-months">
                {monthShortNames.map((mn, mi) => (
                  <button
                    key={mn}
                    type="button"
                    className={`cal-jump-month${mi === month && jumpYear === year ? ' active' : ''}`}
                    onClick={() => {
                      setCurrentDate(new Date(jumpYear, mi, 1));
                      setShowJumpPanel(false);
                    }}
                  >
                    {mn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div className="cal-header">
            <button type="button" className="cal-nav-btn" onClick={() => navMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="cal-month-label cal-month-label--btn"
              onClick={() => setShowJumpPanel(s => !s)}
              aria-label="Select month and year"
              aria-expanded={showJumpPanel}
            >
              {monthNames[month]} {year}
              <ChevronDown size={11} strokeWidth={2.5} style={{ marginLeft: 3, opacity: 0.6 }} />
            </button>
            <button type="button" className="cal-nav-btn" onClick={() => navMonth(1)} aria-label="Next month">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* ── Weekday headers ── */}
          <div className="cal-weekdays" role="row">
            {weekdayLabels.map(wd => (
              <span key={wd} className="cal-wd" role="columnheader" aria-label={wd}>{wd}</span>
            ))}
          </div>

          {/* ── Day grid ── */}
          <div
            className="cal-days"
            role="grid"
            aria-label={`${monthNames[month]} ${year}`}
            onKeyDown={handleGridKeyDown}
          >
            {daysArray.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} className="cal-day empty" role="gridcell" />;

              const disabled = isDayDisabled(day, year, month, disabledOpts);
              const isSel = selDate && selDate.getDate() === day && selDate.getMonth() === month && selDate.getFullYear() === year;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isFocusTarget = focusedDay === day || (!focusedDay && !!isSel);

              return (
                <div
                  key={`d-${day}`}
                  role="gridcell"
                  tabIndex={isFocusTarget ? 0 : -1}
                  className={`cal-day${isSel ? ' selected' : ''}${isToday ? ' today' : ''}${disabled ? ' disabled' : ''}`}
                  onClick={() => !disabled && handleDaySelect(day)}
                  onFocus={() => setFocusedDay(day)}
                  ref={el => { if (el) dayRefs.current.set(day, el); else dayRefs.current.delete(day); }}
                  aria-selected={!!isSel}
                  aria-disabled={disabled}
                  aria-label={`${day} ${monthNames[month]} ${year}${disabled ? ', unavailable' : ''}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPicker;
