import { STARS_URL, SUBSYSTEM_URLS } from '../config/env';

export interface AuthSession {
  authToken: string;
  refreshToken: string;
  userRole: string;
  employeeId: string;
  employeeName: string;
}

export const AUTH_STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ROLE: 'userRole',
  EMPLOYEE_ID: 'employeeId',
  EMPLOYEE_NAME: 'employeeName',
} as const;

/**
 * Computes 1-2 letter uppercase initials for user avatars.
 */
export function getAvatarInitials(name?: string): string {
  if (!name || !name.trim()) return 'SP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Constructs the STARS login redirect URL with a return destination parameter.
 */
export function getStarsLoginUrl(returnRoute: string = '/portal'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUri = encodeURIComponent(`${origin}${returnRoute.startsWith('/') ? returnRoute : `/${returnRoute}`}`);
  return `${STARS_URL}/?redirect_uri=${redirectUri}`;
}

/**
 * Redirects browser directly to the STARS login URL.
 */
export function redirectToStarsLogin(returnRoute: string = '/portal'): void {
  if (typeof window !== 'undefined') {
    window.location.href = getStarsLoginUrl(returnRoute);
  }
}

/**
 * Parses the URL hash fragment returned by STARS login.
 * Handles both #key=value and #/key=value formats gracefully.
 */
export function parseAuthHash(hashString: string): Partial<AuthSession> | null {
  if (!hashString) return null;

  let cleanHash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
  if (cleanHash.startsWith('/')) {
    cleanHash = cleanHash.slice(1);
  }
  if (cleanHash.startsWith('?')) {
    cleanHash = cleanHash.slice(1);
  }
  if (!cleanHash) return null;

  const params = new URLSearchParams(cleanHash);
  const token = params.get('token') || params.get('authToken') || params.get('access_token');
  const refreshToken = params.get('refreshToken') || params.get('refresh_token') || '';
  const role = params.get('role') || params.get('userRole') || '';
  const employeeId = params.get('employeeId') || params.get('employee_id') || params.get('id') || '';
  const employeeNameRaw = params.get('employeeName') || params.get('employee_name') || params.get('name') || '';

  if (!token && !role && !employeeId && !employeeNameRaw) {
    return null;
  }

  let employeeName = employeeNameRaw;
  try {
    employeeName = decodeURIComponent(employeeNameRaw);
  } catch {
    // Keep as is if already decoded
  }

  return {
    authToken: token || '',
    refreshToken,
    userRole: role,
    employeeId,
    employeeName,
  };
}

/**
 * Reads the current authenticated session from localStorage.
 */
export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  const authToken = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TOKEN);
  if (!authToken) return null;

  return {
    authToken,
    refreshToken: localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN) || '',
    userRole: localStorage.getItem(AUTH_STORAGE_KEYS.USER_ROLE) || 'Staff',
    employeeId: localStorage.getItem(AUTH_STORAGE_KEYS.EMPLOYEE_ID) || '',
    employeeName: localStorage.getItem(AUTH_STORAGE_KEYS.EMPLOYEE_NAME) || 'Speedex Staff',
  };
}

/**
 * Saves authenticated tokens and user metadata to localStorage.
 */
export function saveAuthSession(data: Partial<AuthSession>): void {
  if (typeof window === 'undefined') return;

  if (data.authToken !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, data.authToken);
  }
  if (data.refreshToken !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  }
  if (data.userRole !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER_ROLE, data.userRole);
  }
  if (data.employeeId !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.EMPLOYEE_ID, data.employeeId);
  }
  if (data.employeeName !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.EMPLOYEE_NAME, data.employeeName);
  }
}

/**
 * Clears all authentication credentials and metadata from localStorage.
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER_ROLE);
  localStorage.removeItem(AUTH_STORAGE_KEYS.EMPLOYEE_ID);
  localStorage.removeItem(AUTH_STORAGE_KEYS.EMPLOYEE_NAME);
}

/**
 * Generates the redirect URL for entering a subsystem with the authentication hash.
 */
export function getSubsystemRedirectUrl(
  systemKey: 'stars' | 'dms' | 'foms' | string,
  session?: Partial<AuthSession> | null
): string {
  const currentSession = session || getStoredAuthSession() || {
    authToken: '',
    refreshToken: '',
    userRole: '',
    employeeId: '',
    employeeName: '',
  };

  const baseUrl = SUBSYSTEM_URLS[systemKey.toLowerCase()] || STARS_URL;
  const authToken = currentSession.authToken || '';
  const refreshToken = currentSession.refreshToken || '';
  const role = currentSession.userRole || '';
  const employeeId = currentSession.employeeId || '';
  const employeeName = encodeURIComponent(currentSession.employeeName || '');

  return `${baseUrl}/#token=${authToken}&refreshToken=${refreshToken}&role=${role}&employeeId=${employeeId}&employeeName=${employeeName}`;
}

/**
 * Redirects the user to the chosen subsystem already authenticated.
 */
export function redirectToSubsystem(
  systemKey: 'stars' | 'dms' | 'foms' | string,
  session?: Partial<AuthSession> | null
): void {
  if (typeof window !== 'undefined') {
    const url = getSubsystemRedirectUrl(systemKey, session);
    window.location.href = url;
  }
}
