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
  TOKEN: 'token',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ROLE: 'userRole',
  ROLE: 'role',
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
 * Parses authentication parameters from URL hash fragment or search query string.
 * Supports token, accessToken, authToken, userRole, role, employeeId, and employeeName.
 */
export function parseAuthFromUrl(customUrl?: string): Partial<AuthSession> | null {
  if (typeof window === 'undefined' && !customUrl) return null;

  const urlHash = customUrl ? (customUrl.includes('#') ? customUrl.split('#')[1] : '') : window.location.hash;
  const urlSearch = customUrl ? (customUrl.includes('?') ? customUrl.split('?')[1].split('#')[0] : '') : window.location.search;

  // Clean strings
  const cleanHash = (urlHash || '').replace(/^#\/?\??/, '');
  const cleanSearch = (urlSearch || '').replace(/^\?/, '');

  const hashParams = new URLSearchParams(cleanHash);
  const searchParams = new URLSearchParams(cleanSearch);

  const getParam = (key: string): string => {
    return hashParams.get(key) || searchParams.get(key) || '';
  };

  const token =
    getParam('token') ||
    getParam('authToken') ||
    getParam('accessToken') ||
    getParam('access_token') ||
    getParam('jwt') ||
    getParam('bearerToken');

  const refreshToken =
    getParam('refreshToken') ||
    getParam('refresh_token') ||
    getParam('refresh');

  const role =
    getParam('role') ||
    getParam('userRole') ||
    getParam('user_role') ||
    getParam('roles') ||
    getParam('position');

  const employeeId =
    getParam('employeeId') ||
    getParam('employee_id') ||
    getParam('empId') ||
    getParam('userId') ||
    getParam('id');

  const rawName =
    getParam('employeeName') ||
    getParam('employee_name') ||
    getParam('empName') ||
    getParam('name') ||
    getParam('userName') ||
    getParam('fullName');

  if (!token && !role && !employeeId && !rawName) {
    return null;
  }

  let employeeName = rawName;
  try {
    employeeName = decodeURIComponent(rawName);
  } catch {
    // Keep as is if decode fails
  }

  return {
    authToken: token || '',
    refreshToken: refreshToken || '',
    userRole: role || '',
    employeeId: employeeId || '',
    employeeName: employeeName || '',
  };
}

/**
 * Legacy alias for parseAuthFromUrl
 */
export function parseAuthHash(hashString: string): Partial<AuthSession> | null {
  return parseAuthFromUrl(hashString);
}

/**
 * Reads the current authenticated session from localStorage.
 */
export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  const authToken =
    localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TOKEN) ||
    localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN) ||
    localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);

  if (!authToken) return null;

  const refreshToken =
    localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN) ||
    localStorage.getItem('refresh_token') ||
    '';

  const userRole =
    localStorage.getItem(AUTH_STORAGE_KEYS.USER_ROLE) ||
    localStorage.getItem(AUTH_STORAGE_KEYS.ROLE) ||
    'Staff';

  const employeeId =
    localStorage.getItem(AUTH_STORAGE_KEYS.EMPLOYEE_ID) ||
    localStorage.getItem('employee_id') ||
    localStorage.getItem('id') ||
    '';

  const employeeName =
    localStorage.getItem(AUTH_STORAGE_KEYS.EMPLOYEE_NAME) ||
    localStorage.getItem('employee_name') ||
    localStorage.getItem('name') ||
    'Speedex Staff';

  return {
    authToken,
    refreshToken,
    userRole,
    employeeId,
    employeeName,
  };
}

/**
 * Saves authenticated tokens and user metadata to localStorage.
 */
export function saveAuthSession(data: Partial<AuthSession>): void {
  if (typeof window === 'undefined') return;

  if (data.authToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, data.authToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, data.authToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, data.authToken);
  }
  if (data.refreshToken !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  }
  if (data.userRole) {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER_ROLE, data.userRole);
    localStorage.setItem(AUTH_STORAGE_KEYS.ROLE, data.userRole);
  }
  if (data.employeeId) {
    localStorage.setItem(AUTH_STORAGE_KEYS.EMPLOYEE_ID, data.employeeId);
    localStorage.setItem('employee_id', data.employeeId);
    localStorage.setItem('id', data.employeeId);
  }
  if (data.employeeName) {
    localStorage.setItem(AUTH_STORAGE_KEYS.EMPLOYEE_NAME, data.employeeName);
    localStorage.setItem('employee_name', data.employeeName);
    localStorage.setItem('name', data.employeeName);
  }
}

/**
 * Clears all authentication credentials and metadata from localStorage.
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem('refresh_token');
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER_ROLE);
  localStorage.removeItem(AUTH_STORAGE_KEYS.ROLE);
  localStorage.removeItem(AUTH_STORAGE_KEYS.EMPLOYEE_ID);
  localStorage.removeItem('employee_id');
  localStorage.removeItem('id');
  localStorage.removeItem(AUTH_STORAGE_KEYS.EMPLOYEE_NAME);
  localStorage.removeItem('employee_name');
  localStorage.removeItem('name');
}

/**
 * Generates the redirect URL for entering a subsystem with the authentication credentials.
 * Attaches comprehensive auth parameters in both search and hash formats to ensure
 * immediate authentication across different routing libraries and subsystem configurations.
 */
export function getSubsystemRedirectUrl(
  systemKey: 'stars' | 'dms' | 'foms' | string,
  session?: Partial<AuthSession> | null
): string {
  const currentSession: AuthSession = {
    authToken: '',
    refreshToken: '',
    userRole: '',
    employeeId: '',
    employeeName: '',
    ...(getStoredAuthSession() || {}),
    ...(session || {}),
  };

  const baseUrl = SUBSYSTEM_URLS[systemKey.toLowerCase()] || STARS_URL;
  const authToken = currentSession.authToken || '';
  const refreshToken = currentSession.refreshToken || '';
  const role = currentSession.userRole || '';
  const employeeId = currentSession.employeeId || '';
  const employeeName = currentSession.employeeName || '';

  const params = new URLSearchParams();
  if (authToken) {
    params.set('token', authToken);
    params.set('authToken', authToken);
    params.set('accessToken', authToken);
    params.set('access_token', authToken);
  }
  if (refreshToken) {
    params.set('refreshToken', refreshToken);
    params.set('refresh_token', refreshToken);
  }
  if (role) {
    params.set('role', role);
    params.set('userRole', role);
  }
  if (employeeId) {
    params.set('employeeId', employeeId);
    params.set('employee_id', employeeId);
    params.set('id', employeeId);
  }
  if (employeeName) {
    params.set('employeeName', employeeName);
    params.set('employee_name', employeeName);
    params.set('name', employeeName);
  }

  const queryString = params.toString();

  // Attach params in both query and hash so any subsystem router (BrowserRouter or HashRouter)
  // or auth provider component detects the authentication state immediately upon mount.
  return `${baseUrl}/?${queryString}#${queryString}`;
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
