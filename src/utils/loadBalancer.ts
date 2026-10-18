/**
 * Multi-Node Load Balancer, Health Prober, and Azure Cold-Start Pre-Warmer.
 */
import { SUBSYSTEM_API_URLS, STARS_API_URL, DMS_API_URL, FOMS_API_URL } from '../config/env';

interface NodeStatus {
  url: string;
  isHealthy: boolean;
  lastChecked: number;
  latencyMs?: number;
}

const nodeRegistry: Record<string, NodeStatus[]> = {
  stars: [
    { url: STARS_API_URL, isHealthy: true, lastChecked: 0 },
  ],
  dms: [
    { url: DMS_API_URL, isHealthy: true, lastChecked: 0 },
  ],
  foms: [
    { url: FOMS_API_URL, isHealthy: true, lastChecked: 0 },
  ],
};

const prewarmCache: Record<string, number> = {};
const PREWARM_THROTTLE_MS = 30 * 1000; // Only ping once per 30s per system

/**
 * Fires a silent, non-blocking pre-warming ping to the target Azure App Service.
 * Eliminates the 15-25s idle wake-up latency when staff click Login.
 */
export function prewarmBackend(systemKey: 'stars' | 'dms' | 'foms' | string): void {
  const key = systemKey.toLowerCase();
  const now = Date.now();
  if (prewarmCache[key] && now - prewarmCache[key] < PREWARM_THROTTLE_MS) {
    return; // Already pre-warmed recently
  }
  prewarmCache[key] = now;

  const targetUrl = SUBSYSTEM_API_URLS[key];
  if (!targetUrl) return;

  // Use fetch with no-cors and HEAD/GET to trigger Azure App Service container spin-up
  try {
    const healthUrl = `${targetUrl}/api/health`;
    fetch(healthUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
    }).catch(() => {
      // Fallback ping to root URL
      fetch(targetUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
      }).catch(() => {/* non-blocking */});
    });
  } catch {
    // Non-blocking best-effort
  }
}

/**
 * Resolves the primary active backend URL for the specified system.
 */
export function getActiveBackendUrl(systemKey: 'stars' | 'dms' | 'foms' | string): string {
  const key = systemKey.toLowerCase();
  const nodes = nodeRegistry[key];
  if (nodes && nodes.length > 0) {
    const healthyNode = nodes.find((n) => n.isHealthy) || nodes[0];
    return healthyNode.url;
  }
  return SUBSYSTEM_API_URLS[key] || STARS_API_URL;
}
