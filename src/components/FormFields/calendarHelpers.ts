// ─────────────────────────────────────────────────────────────────
// Shared calendar helpers — used by CalendarPicker & CalendarRangePicker
// ─────────────────────────────────────────────────────────────────

/** Parse ISO date string locally (avoids UTC midnight shift). */
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Serialize year/month/day → ISO string. */
export function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Full month names via Intl (January … December). */
export function getMonthNames(locale: string): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, i, 1))
  );
}

/** 3-char abbreviated month names via Intl (Jan … Dec). */
export function getMonthShortNames(locale: string): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2024, i, 1))
  );
}

/**
 * Weekday header labels — Sunday-first.
 * Ref date: 2024-01-07 = Sunday, so 7+0…7+6 = Sun…Sat.
 */
export function getWeekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + i))
  );
}

export interface DayDisabledOpts {
  minDate?: string;       // ISO — days before are blocked
  maxDate?: string;       // ISO — days after are blocked
  disabledDates?: string[];
  disablePastDates?: boolean; // legacy shorthand for minDate = today
}

export function isDayDisabled(day: number, year: number, month: number, opts: DayDisabledOpts): boolean {
  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);

  if (opts.disablePastDates) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d < today) return true;
  }
  if (opts.minDate) {
    const min = isoToDate(opts.minDate); min.setHours(0, 0, 0, 0);
    if (d < min) return true;
  }
  if (opts.maxDate) {
    const max = isoToDate(opts.maxDate); max.setHours(0, 0, 0, 0);
    if (d > max) return true;
  }
  if (opts.disabledDates?.length) {
    if (opts.disabledDates.includes(toIso(year, month, day))) return true;
  }
  return false;
}
