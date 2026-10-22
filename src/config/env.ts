/**
 * Environment configuration for Speedex integration.
 * Provides endpoints for STARS auth provider and subsystems (STARS, DMS, FOMS).
 */

const normalizeUrl = (url: string | undefined, defaultUrl: string): string => {
  const target = (url && url.trim()) || defaultUrl;
  return target.replace(/\/+$/, '');
};

// STARS authentication and task management provider URL
export const STARS_URL = normalizeUrl(
  import.meta.env.VITE_STARS_URL || import.meta.env.VITE_STARS_AUTH_URL,
  'https://stars-two-chi.vercel.app'
);

// Delivery Management System (DMS) URL
export const DMS_URL = normalizeUrl(
  import.meta.env.VITE_DMS_URL,
  'https://delivery-system-capstone-beige.vercel.app'
);

// Delivery Management System (DMS) Public Tracking URL
export const DMS_TRACKING_URL = normalizeUrl(
  import.meta.env.VITE_DMS_TRACKING_URL,
  'https://delivery-system-capstone-beige.vercel.app/tracking'
);

// Financial Operations Management System (FOMS) URL
export const FOMS_URL = normalizeUrl(
  import.meta.env.VITE_FOMS_URL,
  'https://fomsfrontend.vercel.app'
);

export const SUBSYSTEM_URLS: Record<string, string> = {
  stars: STARS_URL,
  dms: DMS_URL,
  foms: FOMS_URL,
};

// Backend Azure API Endpoints
export const STARS_API_URL = normalizeUrl(
  import.meta.env.VITE_STARS_API_URL,
  'https://stars-h8bgfbhghzbdc9fd.southeastasia-01.azurewebsites.net'
);

export const DMS_API_URL = normalizeUrl(
  import.meta.env.VITE_DMS_API_URL,
  'https://dts-api-gab-byafd0h2aha6a9c9.japaneast-01.azurewebsites.net'
);

export const FOMS_API_URL = normalizeUrl(
  import.meta.env.VITE_FOMS_API_URL,
  'https://fomsintegration-amfve2fdccbdgbgy.eastasia-01.azurewebsites.net'
);

export const SUBSYSTEM_API_URLS: Record<string, string> = {
  stars: STARS_API_URL,
  dms: DMS_API_URL,
  foms: FOMS_API_URL,
};
