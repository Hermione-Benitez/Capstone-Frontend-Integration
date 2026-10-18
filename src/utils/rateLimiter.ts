/**
 * Dual-Layer Rate Limiting Engine for Central One-Login.
 * Implements sliding window token-bucket tracking with progressive lockout cooldowns.
 */

const STORAGE_KEY = 'speedex_rate_limit_records';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 60 seconds sliding window

// Progressive cooldown steps in seconds
const COOLDOWN_STEPS = [30, 60, 300];

interface RateLimitRecord {
  attempts: number[]; // Timestamps of failed attempts within window
  lockoutCount: number; // How many times locked out in current streak
  lockedUntil?: number; // Timestamp when current cooldown ends
}

function getRecords(): Record<string, RateLimitRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRecords(records: Record<string, RateLimitRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage failure safeguard
  }
}

export interface RateLimitStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
  totalAttempts: number;
}

/**
 * Checks if the identifier (e.g. employeeId or IP key) is currently locked out or throttled.
 */
export function checkRateLimit(identifier: string): RateLimitStatus {
  if (!identifier) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS, totalAttempts: 0 };
  }

  const key = identifier.trim().toLowerCase();
  const records = getRecords();
  const record = records[key];

  if (!record) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS, totalAttempts: 0 };
  }

  const now = Date.now();

  // Check active lockout
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      attemptsLeft: 0,
      totalAttempts: record.attempts.length,
    };
  }

  // Filter attempts strictly inside the rolling window
  const activeAttempts = record.attempts.filter((ts) => now - ts < WINDOW_MS);
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - activeAttempts.length);

  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft,
    totalAttempts: activeAttempts.length,
  };
}

/**
 * Records a failed credential attempt. If threshold is breached, initiates progressive cooldown.
 */
export function recordFailedAttempt(identifier: string): RateLimitStatus {
  if (!identifier) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS, totalAttempts: 0 };
  }

  const key = identifier.trim().toLowerCase();
  const records = getRecords();
  const now = Date.now();

  const record: RateLimitRecord = records[key] || {
    attempts: [],
    lockoutCount: 0,
  };

  // Remove timestamps outside window
  record.attempts = record.attempts.filter((ts) => now - ts < WINDOW_MS);
  record.attempts.push(now);

  if (record.attempts.length >= MAX_ATTEMPTS) {
    // Determine cooldown duration
    const stepIndex = Math.min(record.lockoutCount, COOLDOWN_STEPS.length - 1);
    const cooldownSeconds = COOLDOWN_STEPS[stepIndex];
    record.lockedUntil = now + cooldownSeconds * 1000;
    record.lockoutCount += 1;
    record.attempts = []; // Reset attempts for next cycle

    records[key] = record;
    saveRecords(records);

    return {
      isLocked: true,
      remainingSeconds: cooldownSeconds,
      attemptsLeft: 0,
      totalAttempts: MAX_ATTEMPTS,
    };
  }

  records[key] = record;
  saveRecords(records);

  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - record.attempts.length),
    totalAttempts: record.attempts.length,
  };
}

/**
 * Resets rate limit records upon successful authentication.
 */
export function resetRateLimit(identifier: string): void {
  if (!identifier) return;
  const key = identifier.trim().toLowerCase();
  const records = getRecords();
  if (records[key]) {
    delete records[key];
    saveRecords(records);
  }
}
