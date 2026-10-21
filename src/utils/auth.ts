import { STARS_URL, SUBSYSTEM_URLS } from '../config/env';

export interface AuthSession {
  authToken: string;
  refreshToken: string;
  userRole: string;
  employeeId: string;
  employeeName: string;
  allowedSystems?: string[];
  contactNumber?: string;
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
  ALLOWED_SYSTEMS: 'allowedSystems',
  CONTACT_NUMBER: 'contactNumber',
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
 * Normalizes any Philippine mobile phone number into standard 11-digit 09XXXXXXXXX format.
 * Handles '+639171234567', '639171234567', '9171234567', etc.
 */
export function normalizePhMobile(raw?: string | null): string {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('639') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('9') && digits.length === 10) {
    digits = '0' + digits;
  }
  return digits.slice(0, 11);
}

/**
 * Aggressively scans an API response object for contact/mobile numbers across common field aliases.
 */
export function extractContactNumber(obj?: any): string {
  if (!obj || typeof obj !== 'object') return '';
  const rawCandidate =
    obj.contactNumber ||
    obj.contactNo ||
    obj.contact_number ||
    obj.contact_no ||
    obj.mobileNumber ||
    obj.mobileNo ||
    obj.mobile_number ||
    obj.mobile_no ||
    obj.phoneNumber ||
    obj.phoneNo ||
    obj.phone_number ||
    obj.phone_no ||
    obj.phone ||
    obj.mobile ||
    obj.cellphone ||
    obj.cellphoneNumber ||
    obj.telephone ||
    obj.tel ||
    obj.user?.contactNumber ||
    obj.user?.contactNo ||
    obj.user?.contact_number ||
    obj.user?.mobileNumber ||
    obj.user?.mobileNo ||
    obj.user?.phoneNumber ||
    obj.user?.phone ||
    obj.user?.mobile ||
    obj.employee?.contactNumber ||
    obj.employee?.contactNo ||
    obj.employee?.contact_number ||
    obj.employee?.mobileNumber ||
    obj.employee?.mobileNo ||
    obj.employee?.phoneNumber ||
    obj.employee?.phone ||
    obj.profile?.contactNumber ||
    obj.profile?.contactNo ||
    obj.profile?.mobileNumber ||
    obj.profile?.phone ||
    '';

  return normalizePhMobile(rawCandidate);
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

  const rawSystems =
    getParam('allowedSystems') ||
    getParam('allowed_systems') ||
    getParam('systems') ||
    getParam('targetSystems');

  const allowedSystems = rawSystems
    ? rawSystems.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : undefined;

  if (!token && !role && !employeeId && !rawName && !allowedSystems) {
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
    ...(allowedSystems ? { allowedSystems } : {}),
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

  const rawAllowed = localStorage.getItem(AUTH_STORAGE_KEYS.ALLOWED_SYSTEMS);
  let allowedSystems: string[] = [];
  if (rawAllowed) {
    try {
      allowedSystems = rawAllowed.startsWith('[')
        ? JSON.parse(rawAllowed)
        : rawAllowed.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    } catch {
      allowedSystems = rawAllowed.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    }
  } else {
    // Legacy / existing accounts without explicit allowedSystems default to STARS (or all systems for root 0000)
    allowedSystems = employeeId === '0000' ? ['STARS', 'DMS', 'FOMS'] : ['STARS'];
  }

  const contactNumber =
    localStorage.getItem(AUTH_STORAGE_KEYS.CONTACT_NUMBER) ||
    localStorage.getItem('contactNumber') ||
    localStorage.getItem('contact_number') ||
    localStorage.getItem('phoneNumber') ||
    localStorage.getItem('phone_number') ||
    localStorage.getItem('mobileNumber') ||
    localStorage.getItem('mobile_number') ||
    localStorage.getItem('contact') ||
    localStorage.getItem('phone') ||
    localStorage.getItem('mobile') ||
    '';

  return {
    authToken,
    refreshToken,
    userRole,
    employeeId,
    employeeName,
    allowedSystems,
    contactNumber: normalizePhMobile(contactNumber),
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
  if (data.allowedSystems && Array.isArray(data.allowedSystems)) {
    localStorage.setItem(AUTH_STORAGE_KEYS.ALLOWED_SYSTEMS, data.allowedSystems.join(','));
  }
  if (data.contactNumber !== undefined && data.contactNumber !== null) {
    const normalized = normalizePhMobile(data.contactNumber);
    if (normalized) {
      localStorage.setItem(AUTH_STORAGE_KEYS.CONTACT_NUMBER, normalized);
      localStorage.setItem('contactNumber', normalized);
      localStorage.setItem('phoneNumber', normalized);
      localStorage.setItem('mobileNumber', normalized);
      localStorage.setItem('contact', normalized);
    }
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
  localStorage.removeItem(AUTH_STORAGE_KEYS.ALLOWED_SYSTEMS);
  localStorage.removeItem(AUTH_STORAGE_KEYS.CONTACT_NUMBER);
  localStorage.removeItem('contactNumber');
  localStorage.removeItem('contact_number');
  localStorage.removeItem('phoneNumber');
  localStorage.removeItem('phone_number');
  localStorage.removeItem('mobileNumber');
  localStorage.removeItem('mobile_number');
  localStorage.removeItem('contact');
  localStorage.removeItem('phone');
  localStorage.removeItem('mobile');
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
    allowedSystems: ['STARS'],
    contactNumber: '',
    ...(getStoredAuthSession() || {}),
    ...(session || {}),
  };

  const baseUrl = SUBSYSTEM_URLS[systemKey.toLowerCase()] || STARS_URL;
  const authToken = currentSession.authToken || '';
  const refreshToken = currentSession.refreshToken || '';
  const role = currentSession.userRole || '';
  const employeeId = currentSession.employeeId || '';
  const employeeName = currentSession.employeeName || '';
  const allowedSystems = currentSession.allowedSystems || [];

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
  if (allowedSystems.length > 0) {
    params.set('allowedSystems', allowedSystems.join(','));
  }

  const queryString = params.toString();
  const normalizedKey = systemKey.toLowerCase();
  let targetPath = '/';
  if (normalizedKey === 'dms') {
    const isDriver = role.toUpperCase().includes('DRIVER') || role.toUpperCase().includes('COURIER') || role.toUpperCase().includes('RIDER');
    targetPath = isDriver ? '/driver/dashboard' : '/dashboard';
  } else if (normalizedKey === 'foms') {
    targetPath = '/dashboard';
  }

  // Attach params in both query and hash so any subsystem router (BrowserRouter or HashRouter)
  // or auth provider component detects the authentication state immediately upon mount.
  return `${baseUrl}${targetPath}?${queryString}#${queryString}`;
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
