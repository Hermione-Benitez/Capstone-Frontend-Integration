/**
 * Dual-Layer Security & Rate Limiting Engine for Central One-Login.
 * Tracks consecutive failed login attempts and initiates a strict 24-hour account lockout
 * after 5 consecutive failed attempts.
 */

const STORAGE_KEY = 'speedex_rate_limit_records';
const LAST_LOCKED_KEY = 'speedex_last_locked_employee_id';

export const MAX_CONSECUTIVE_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const LOCKOUT_DURATION_SECONDS = 24 * 60 * 60; // 86,400 seconds

export interface RateLimitRecord {
  attempts: number[]; // Timestamps of failed attempts
  consecutiveFails: number; // Count of consecutive failed attempts
  lockedUntil?: number; // Timestamp when 24h lockout ends
  lockedAt?: number; // Timestamp when lockout was initiated
  employeeId?: string; // Stored canonical identifier
  reason?: string;
}

export interface RateLimitStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
  totalAttempts: number;
  lockedUntil?: number;
  lockedAt?: number;
  employeeId?: string;
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

export function getLastLockedEmployeeId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LAST_LOCKED_KEY) || '';
}

export function setLastLockedEmployeeId(id: string): void {
  if (typeof window === 'undefined') return;
  if (!id) {
    localStorage.removeItem(LAST_LOCKED_KEY);
  } else {
    localStorage.setItem(LAST_LOCKED_KEY, id.trim());
  }
}

/**
 * Checks if the identifier (e.g. employeeId or username) is currently locked out.
 * If 24 hours have elapsed since the lockout, the lock automatically expires.
 */
export function checkRateLimit(identifier?: string): RateLimitStatus {
  const targetId = (identifier || getLastLockedEmployeeId()).trim();
  if (!targetId) {
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_CONSECUTIVE_ATTEMPTS,
      totalAttempts: 0,
      employeeId: '',
    };
  }

  const key = targetId.toLowerCase();
  const records = getRecords();
  const record = records[key];

  if (!record) {
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_CONSECUTIVE_ATTEMPTS,
      totalAttempts: 0,
      employeeId: targetId,
    };
  }

  const now = Date.now();

  // Check active lockout
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      attemptsLeft: 0,
      totalAttempts: record.consecutiveFails || MAX_CONSECUTIVE_ATTEMPTS,
      lockedUntil: record.lockedUntil,
      lockedAt: record.lockedAt,
      employeeId: record.employeeId || targetId,
    };
  }

  // If lockout timer expired (past 24 hours), clear lockout state
  if (record.lockedUntil && record.lockedUntil <= now) {
    delete record.lockedUntil;
    delete record.lockedAt;
    record.consecutiveFails = 0;
    record.attempts = [];
    records[key] = record;
    saveRecords(records);
    if (getLastLockedEmployeeId().toLowerCase() === key) {
      setLastLockedEmployeeId('');
    }
  }

  const consecutive = record.consecutiveFails || 0;
  const attemptsLeft = Math.max(0, MAX_CONSECUTIVE_ATTEMPTS - consecutive);

  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft,
    totalAttempts: consecutive,
    employeeId: record.employeeId || targetId,
  };
}

/**
 * Records a failed credential attempt.
 * If 5 consecutive fails occur, locks the account for 24 hours.
 */
export function recordFailedAttempt(identifier: string, reason?: string): RateLimitStatus {
  if (!identifier) {
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_CONSECUTIVE_ATTEMPTS,
      totalAttempts: 0,
    };
  }

  const rawId = identifier.trim();
  const key = rawId.toLowerCase();
  const records = getRecords();
  const now = Date.now();

  const record: RateLimitRecord = records[key] || {
    attempts: [],
    consecutiveFails: 0,
  };

  record.employeeId = rawId;

  // If previous lockout expired, ensure fresh streak
  if (record.lockedUntil && record.lockedUntil <= now) {
    delete record.lockedUntil;
    delete record.lockedAt;
    record.consecutiveFails = 0;
    record.attempts = [];
  }

  // Increment consecutive failed attempt
  record.consecutiveFails = (record.consecutiveFails || 0) + 1;
  record.attempts.push(now);

  if (record.consecutiveFails >= MAX_CONSECUTIVE_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    record.lockedUntil = lockedUntil;
    record.lockedAt = now;
    record.reason = reason || 'Exceeded 5 consecutive failed login attempts';

    records[key] = record;
    saveRecords(records);
    setLastLockedEmployeeId(rawId);

    return {
      isLocked: true,
      remainingSeconds: LOCKOUT_DURATION_SECONDS,
      attemptsLeft: 0,
      totalAttempts: record.consecutiveFails,
      lockedUntil,
      lockedAt: now,
      employeeId: rawId,
    };
  }

  records[key] = record;
  saveRecords(records);

  const attemptsLeft = Math.max(0, MAX_CONSECUTIVE_ATTEMPTS - record.consecutiveFails);

  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft,
    totalAttempts: record.consecutiveFails,
    employeeId: rawId,
  };
}

/**
 * Manually or programmatically triggers a 24-hour lockout (e.g. server signals locked account).
 */
export function forceLockAccount(
  identifier: string,
  durationMs: number = LOCKOUT_DURATION_MS,
  reason?: string
): RateLimitStatus {
  if (!identifier) {
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_CONSECUTIVE_ATTEMPTS,
      totalAttempts: 0,
    };
  }

  const rawId = identifier.trim();
  const key = rawId.toLowerCase();
  const records = getRecords();
  const now = Date.now();

  const record: RateLimitRecord = records[key] || {
    attempts: [],
    consecutiveFails: MAX_CONSECUTIVE_ATTEMPTS,
  };

  record.employeeId = rawId;
  record.consecutiveFails = Math.max(record.consecutiveFails || 0, MAX_CONSECUTIVE_ATTEMPTS);
  record.lockedUntil = now + durationMs;
  record.lockedAt = now;
  record.reason = reason || 'Security Lockout - Maximum consecutive login attempts exceeded';

  records[key] = record;
  saveRecords(records);
  setLastLockedEmployeeId(rawId);

  const remainingSeconds = Math.ceil(durationMs / 1000);

  return {
    isLocked: true,
    remainingSeconds,
    attemptsLeft: 0,
    totalAttempts: record.consecutiveFails,
    lockedUntil: record.lockedUntil,
    lockedAt: now,
    employeeId: rawId,
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
  if (getLastLockedEmployeeId().toLowerCase() === key) {
    setLastLockedEmployeeId('');
  }
}

/**
 * Unlocks an account manually (e.g. admin unlock, self-service reset).
 */
export function unlockAccount(identifier: string): void {
  resetRateLimit(identifier);
}

/**
 * Formats seconds into human-readable duration (e.g., "23h 59m 40s" or "24 hours").
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
