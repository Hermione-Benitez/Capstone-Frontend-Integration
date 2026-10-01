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
  'http://localhost:5174'
);

// Financial Operations Management System (FOMS) URL
export const FOMS_URL = normalizeUrl(
  import.meta.env.VITE_FOMS_URL,
  'http://localhost:5175'
);

export const SUBSYSTEM_URLS: Record<string, string> = {
  stars: STARS_URL,
  dms: DMS_URL,
  foms: FOMS_URL,
};
