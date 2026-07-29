import React, { useState, useRef, useEffect, useId } from 'react';
import {
  AlertTriangle,
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

export interface CalendarRangePickerProps {
  label?: string;
  startValue: string;          // ISO YYYY-MM-DD or ''
  endValue: string;            // ISO YYYY-MM-DD or ''
  onRangeChange: (start: string, end: string) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  locale?: string;
  compact?: boolean;
}

export const CalendarRangePicker: React.FC<CalendarRangePickerProps> = ({
  label,
  startValue,
  endValue,
  onRangeChange,
  state = 'default',
  message,
  required = false,
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
  // pendingStart: user clicked once, awaiting second (end) click
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const disabledOpts: DayDisabledOpts = { minDate, maxDate, disabledDates };

  useEffect(() => {
    const ref = pendingStart || startValue;
    if (ref) {
      const p = isoToDate(ref);
      if (!isNaN(p.getTime())) setCurrentDate(p);
    }
  }, [startValue, pendingStart]);

  useEffect(() => { if (isOpen) setJumpYear(year); }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowJumpPanel(false);
        setPendingStart(null);
        setHoverDay(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const navMonth = (offset: number) => setCurrentDate(new Date(year, month + offset, 1));

  const handleDayClick = (day: number) => {
    if (isDayDisabled(day, year, month, disabledOpts)) return;
    const iso = toIso(year, month, day);

    if (!pendingStart) {
      // First click: set start, clear end
      setPendingStart(iso);
      onRangeChange(iso, '');
    } else {
      const start = isoToDate(pendingStart);
      const end   = isoToDate(iso);
      if (end < start) {
        // Clicked before current start — swap to new start
        setPendingStart(iso);
        onRangeChange(iso, '');
      } else {
        // Valid end — commit range and close
        onRangeChange(pendingStart, iso);
        setPendingStart(null);
        setHoverDay(null);
        setIsOpen(false);
        setShowJumpPanel(false);
      }
    }
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysArray: Array<number | null> = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= totalDays; i++) daysArray.push(i);

  const monthNames      = getMonthNames(effectiveLocale);
  const monthShortNames = getMonthShortNames(effectiveLocale);
  const weekdayLabels   = getWeekdayLabels(effectiveLocale);

  // Effective range for highlight: while picking, use pendingStart + hover
  const effStart = pendingStart || startValue;
  const effEnd   = pendingStart
    ? (hoverDay ? toIso(year, month, hoverDay) : '')
    : endValue;

  const startDate = effStart ? isoToDate(effStart) : null;
  const endDate   = effEnd   ? isoToDate(effEnd)   : null;
  // Normalize so startDate ≤ endDate for highlight calculation
  const [loDate, hiDate] = startDate && endDate && endDate < startDate
    ? [endDate, startDate] : [startDate, endDate];

  const formatDisplay = (iso: string) =>
    iso
      ? new Intl.DateTimeFormat(effectiveLocale, { month: 'short', day: 'numeric', year: 'numeric' }).format(isoToDate(iso))
      : '';

  const computedState = isOpen ? 'focused' : state;
  const isError = computedState === 'error';
  const hasHint = !!message;
  const selecting = !!pendingStart;

  // Suppress unused variable warning - required is passed through to label
  void required;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className={`tf-group state-${computedState}${compact ? ' tf-group--compact' : ''}`}>
        {label && (
          <label className="tf-label">
            {label}
            {required && <span className="tf-label-required"> *</span>}
          </label>
        )}

        {/* Two trigger inputs side-by-side */}
        <div className="cal-range-inputs">
          <div
            className={`tf-wrapper tf-calendar-trigger${selecting ? ' tf-range-selecting' : ''}`}
            onClick={() => state !== 'disabled' && setIsOpen(true)}
          >
            <span className="tf-cal-icon"><CalendarIcon size={15} strokeWidth={2} /></span>
            <input
              type="text"
              value={formatDisplay(startValue)}
              placeholder="From date..."
              readOnly
              className="tf-input tf-cal-input"
              aria-label={`${label} — start date`}
              aria-haspopup="grid"
              aria-expanded={isOpen}
              aria-invalid={isError ? 'true' : 'false'}
            />
          </div>
          <span className="cal-range-sep">→</span>
          <div
            className="tf-wrapper tf-calendar-trigger"
            onClick={() => state !== 'disabled' && setIsOpen(true)}
          >
            <span className="tf-cal-icon"><CalendarIcon size={15} strokeWidth={2} /></span>
            <input
              type="text"
              value={formatDisplay(endValue)}
              placeholder="To date..."
              readOnly
              className="tf-input tf-cal-input"
              aria-label={`${label} — end date`}
              aria-invalid={isError ? 'true' : 'false'}
            />
          </div>
        </div>

        {hasHint && (
          <span className="tf-hint">
            {isError && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
            {message}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="cal-popover" role="dialog" aria-label={`${label} date range calendar`}>

          {/* Contextual banner while awaiting end date */}
          {selecting && (
            <div className="cal-range-banner">
              <CalendarIcon size={12} strokeWidth={2} />
              Now select an end date
            </div>
          )}

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
                    onClick={() => { setCurrentDate(new Date(jumpYear, mi, 1)); setShowJumpPanel(false); }}
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
              <span key={wd} className="cal-wd" role="columnheader">{wd}</span>
            ))}
          </div>

          {/* ── Day grid ── */}
          <div className="cal-days" role="grid" aria-label={`${monthNames[month]} ${year}`}>
            {daysArray.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} className="cal-day empty" role="gridcell" />;

              const disabled = isDayDisabled(day, year, month, disabledOpts);
              const iso = toIso(year, month, day);
              const d   = isoToDate(iso);
              d.setHours(0, 0, 0, 0);

              const isStart   = effStart === iso;
              const isEnd     = effEnd   === iso;
              const inRange   = !!(loDate && hiDate && d > loDate && d < hiDate);
              const isToday   = new Date().toDateString() === new Date(year, month, day).toDateString();

              const classes = ['cal-day'];
              if (isStart)  classes.push('range-start');
              if (isEnd)    classes.push('range-end');
              if (inRange)  classes.push('range-in');
              if (isToday)  classes.push('today');
              if (disabled) classes.push('disabled');

              return (
                <div
                  key={`d-${day}`}
                  role="gridcell"
                  tabIndex={disabled ? -1 : 0}
                  className={classes.join(' ')}
                  onClick={() => !disabled && handleDayClick(day)}
                  onMouseEnter={() => selecting && !disabled && setHoverDay(day)}
                  onMouseLeave={() => setHoverDay(null)}
                  aria-selected={isStart || isEnd}
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

export default CalendarRangePicker;
