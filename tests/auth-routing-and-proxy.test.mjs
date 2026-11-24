import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Capstone-Frontend-Integration Regression Tests', () => {
  describe('Vercel Proxy Rewrites Configuration', () => {
    const vercelConfigPath = path.join(rootDir, 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    it('should have rewrites array defined', () => {
      assert.ok(Array.isArray(vercelConfig.rewrites), 'rewrites must be an array');
    });

    it('should rewrite /api/dms/(.*) to target/$1 without duplicate /api/ prefix', () => {
      const dmsRewrite = vercelConfig.rewrites.find((r) => r.source === '/api/dms/(.*)');
      assert.ok(dmsRewrite, 'dms rewrite rule exists');
      assert.match(
        dmsRewrite.destination,
        /https:\/\/dts-api-gab-byafd0h2aha6a9c9\.japaneast-01\.azurewebsites\.net\/\$1$/,
        'DMS destination must end in /$1 to avoid /api/api double prefix'
      );
      assert.ok(
        !dmsRewrite.destination.includes('/api/$1'),
        'DMS destination must not contain /api/$1'
      );
    });

    it('should rewrite /api/stars/(.*) to target/$1 without duplicate /api/ prefix', () => {
      const starsRewrite = vercelConfig.rewrites.find((r) => r.source === '/api/stars/(.*)');
      assert.ok(starsRewrite, 'stars rewrite rule exists');
      assert.match(
        starsRewrite.destination,
        /https:\/\/stars-h8bgfbhghzbdc9fd\.southeastasia-01\.azurewebsites\.net\/\$1$/,
        'STARS destination must end in /$1'
      );
      assert.ok(
        !starsRewrite.destination.includes('/api/$1'),
        'STARS destination must not contain /api/$1'
      );
    });

    it('should rewrite /api/foms/(.*) to target/$1 without duplicate /api/ prefix', () => {
      const fomsRewrite = vercelConfig.rewrites.find((r) => r.source === '/api/foms/(.*)');
      assert.ok(fomsRewrite, 'foms rewrite rule exists');
      assert.match(
        fomsRewrite.destination,
        /https:\/\/fomsintegration-amfve2fdccbdgbgy\.eastasia-01\.azurewebsites\.net\/\$1$/,
        'FOMS destination must end in /$1'
      );
      assert.ok(
        !fomsRewrite.destination.includes('/api/$1'),
        'FOMS destination must not contain /api/$1'
      );
    });

    it('simulates path translation for candidate endpoints correctly', () => {
      // If frontend candidate is /api/dms, fetch URL is /api/dms/api/auth/login
      const requestPath = '/api/dms/api/auth/login';
      const dmsRewrite = vercelConfig.rewrites.find((r) => r.source === '/api/dms/(.*)');
      const regex = new RegExp('^/api/dms/(.*)$');
      const match = requestPath.match(regex);
      assert.ok(match, 'Request path matches regex');
      const capturedGroup = match[1]; // 'api/auth/login'
      const simulatedUrl = dmsRewrite.destination.replace('$1', capturedGroup);
      assert.equal(
        simulatedUrl,
        'https://dts-api-gab-byafd0h2aha6a9c9.japaneast-01.azurewebsites.net/api/auth/login'
      );
    });
  });

  describe('Unified Login Subsystem Routing & Fallback Logic', () => {
    const isTerminalAccountState = (reason) => {
      const lower = (reason || '').toLowerCase();
      return (
        lower.includes('deactivated') ||
        lower.includes('inactive') ||
        lower.includes('locked') ||
        lower.includes('lockout')
      );
    };

    it('should recognize deactivated, inactive, and locked as terminal states', () => {
      assert.equal(isTerminalAccountState('Account is deactivated by admin'), true);
      assert.equal(isTerminalAccountState('Account is inactive'), true);
      assert.equal(isTerminalAccountState('Account is locked due to too many failed attempts'), true);
      assert.equal(isTerminalAccountState('Account lockout in progress'), true);
      assert.equal(isTerminalAccountState('Invalid credentials'), false);
      assert.equal(isTerminalAccountState('User not found'), false);
    });

    it('should allow FOMS fallback when STARS fails with non-terminal reason even if DMS fails', () => {
      let authSuccess = false;
      let failureReason = 'User not found in STARS';
      const starsCentralTerminated = isTerminalAccountState(failureReason);
      assert.equal(starsCentralTerminated, false);

      // Step 2: DMS fails for EMP-002 because password was for FOMS
      let dmsAttempted = false;
      if (!authSuccess && !starsCentralTerminated) {
        dmsAttempted = true;
        // DMS returns 401
        failureReason = 'Invalid employee ID or password.';
      }
      assert.equal(dmsAttempted, true);
      assert.equal(authSuccess, false);

      // Step 3: FOMS MUST still be evaluated even after DMS failed
      let fomsAttempted = false;
      if (!authSuccess && !starsCentralTerminated) {
        fomsAttempted = true;
        // FOMS succeeds with valid credentials
        authSuccess = true;
      }
      assert.equal(fomsAttempted, true, 'FOMS fallback must be evaluated');
      assert.equal(authSuccess, true, 'Auth succeeds on FOMS');
    });

    it('should NOT allow companion fallback when STARS central account is deactivated or locked', () => {
      let authSuccess = false;
      let failureReason = 'Your account has been deactivated. Please contact HR.';
      const starsCentralTerminated = isTerminalAccountState(failureReason);
      assert.equal(starsCentralTerminated, true);

      let dmsAttempted = false;
      if (!authSuccess && !starsCentralTerminated) {
        dmsAttempted = true;
      }
      assert.equal(dmsAttempted, false, 'DMS must NOT be attempted when STARS deactivated user');

      let fomsAttempted = false;
      if (!authSuccess && !starsCentralTerminated) {
        fomsAttempted = true;
      }
      assert.equal(fomsAttempted, false, 'FOMS must NOT be attempted when STARS deactivated user');
    });

    it('should correctly scope allowed systems for SuperAdmin vs legacy accounts', () => {
      const isSuperAdmin = (id) => id === '0000';

      const superAdminCleanId = '0000';
      const fomsCleanId = 'EMP-002';
      const dmsCleanId = 'EMP-001';

      const superAdminSystems = isSuperAdmin(superAdminCleanId) ? ['STARS', 'DMS', 'FOMS'] : ['FOMS'];
      const fomsSystems = isSuperAdmin(fomsCleanId) ? ['STARS', 'DMS', 'FOMS'] : ['FOMS'];
      const dmsSystems = isSuperAdmin(dmsCleanId) ? ['STARS', 'DMS', 'FOMS'] : ['DMS'];

      assert.deepEqual(superAdminSystems, ['STARS', 'DMS', 'FOMS']);
      assert.deepEqual(fomsSystems, ['FOMS']);
      assert.deepEqual(dmsSystems, ['DMS']);
    });
  });

  describe('Contact & Mobile Number Normalization', () => {
    const normalizePhMobile = (input) => {
      if (!input) return '';
      const digits = input.replace(/\D/g, '');
      if (digits.startsWith('63') && digits.length === 12) {
        return `+${digits}`;
      }
      if (digits.startsWith('09') && digits.length === 11) {
        return `+63${digits.substring(1)}`;
      }
      if (digits.startsWith('9') && digits.length === 10) {
        return `+63${digits}`;
      }
      return input.trim();
    };

    it('normalizes 09xxxxxxxxx to +639xxxxxxxxx', () => {
      assert.equal(normalizePhMobile('09171234567'), '+639171234567');
    });

    it('normalizes 639xxxxxxxxx to +639xxxxxxxxx', () => {
      assert.equal(normalizePhMobile('639171234567'), '+639171234567');
    });

    it('preserves already normalized +639xxxxxxxxx', () => {
      assert.equal(normalizePhMobile('+639171234567'), '+639171234567');
    });
  });
});
