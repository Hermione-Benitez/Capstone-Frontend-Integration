import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SystemSelectorPage, { type SystemKey } from '../components/SystemSelectorPage';
import {
  parseAuthFromUrl,
  getStoredAuthSession,
  saveAuthSession,
  clearAuthSession,
  redirectToSubsystem,
  getAvatarInitials,
  getPrimarySubsystem,
  type AuthSession,
} from '../utils/auth';
import { checkRateLimit } from '../utils/rateLimiter';
import { useCentralSessionTimeout } from '../hooks/useCentralSessionTimeout';

export const PortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 15-minute portal idle timeout monitoring
  useCentralSessionTimeout(!!session);

  useEffect(() => {
    // 0. Check for Single Logout action in query or hash
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const action = searchParams.get('action') || hashParams.get('action');

    if (action === 'logout') {
      clearAuthSession();
      const reason = searchParams.get('reason') || hashParams.get('reason') || 'logged_out';
      const system = searchParams.get('system') || hashParams.get('system') || '';
      navigate(`/login?action=logout&reason=${encodeURIComponent(reason)}${system ? `&system=${system}` : ''}`, { replace: true });
      return;
    }

    // 1. Check if auth tokens are passed via URL hash or search parameters
    const originSystem = (searchParams.get('system') || hashParams.get('system') || '').toLowerCase();
    const urlTokens = parseAuthFromUrl();

    if (urlTokens && urlTokens.authToken) {
      const storedAllowed = localStorage.getItem('allowedSystems');
      const storedEmployeeId = localStorage.getItem('employeeId');
      const isSameUser =
        !storedEmployeeId ||
        !urlTokens.employeeId ||
        storedEmployeeId.trim().toUpperCase() === urlTokens.employeeId.trim().toUpperCase();

      const storedAllowedList = storedAllowed && isSameUser
        ? storedAllowed.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
        : [];
      const incomingAllowedList = urlTokens.allowedSystems || [];

      // Combine allowed systems so we never lose multi-system scope
      const combinedAllowed = Array.from(
        new Set([...storedAllowedList, ...incomingAllowedList])
      );

      const fallbackAllowed =
        combinedAllowed.length > 0
          ? combinedAllowed
          : (urlTokens.employeeId === '0000'
              ? ['STARS', 'DMS', 'FOMS']
              : [originSystem ? originSystem.toUpperCase() : 'STARS']);

      const existingStoredSession = getStoredAuthSession();
      const mergedSystemTokens = {
        ...(existingStoredSession?.systemTokens || {}),
      };

      if (originSystem === 'dms') {
        mergedSystemTokens.dms = {
          token: urlTokens.authToken,
          refreshToken: urlTokens.refreshToken,
          role: urlTokens.userRole,
        };
      } else if (originSystem === 'stars') {
        mergedSystemTokens.stars = {
          token: urlTokens.authToken,
          refreshToken: urlTokens.refreshToken,
          role: urlTokens.userRole,
        };
      } else if (originSystem === 'foms') {
        mergedSystemTokens.foms = {
          token: urlTokens.authToken,
          refreshToken: urlTokens.refreshToken,
          role: urlTokens.userRole,
        };
      }

      saveAuthSession({
        ...urlTokens,
        allowedSystems: fallbackAllowed,
        systemTokens: mergedSystemTokens,
      });

      // Clean the address bar without triggering page refresh
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 2. Validate current auth session from storage
    const currentSession = getStoredAuthSession();

    if (!currentSession || !currentSession.authToken) {
      // Unauthenticated user - redirect to Central Login
      setIsCheckingAuth(false);
      navigate('/login', { replace: true });
      return;
    }

    // 3. Ensure account is not locked out
    const lockStatus = checkRateLimit(currentSession.employeeId);
    if (lockStatus.isLocked) {
      clearAuthSession();
      setIsCheckingAuth(false);
      navigate(`/locked-account?employeeId=${encodeURIComponent(currentSession.employeeId)}`, {
        state: {
          employeeId: currentSession.employeeId,
          remainingSeconds: lockStatus.remainingSeconds,
          lockedUntil: lockStatus.lockedUntil,
        },
        replace: true,
      });
      return;
    }

    // 4. Handle Subsystem Return (Logout) vs Portal Landing Logic
    const singleSubsystem = getPrimarySubsystem(currentSession);
    const isSingleSystem = !!singleSubsystem && currentSession.employeeId !== '0000';

    if (originSystem) {
      // User just returned from logging out of a subsystem (STARS, DMS, or FOMS)
      if (isSingleSystem) {
        // Accounts tied strictly to ONE system must go directly to Central Login page upon logout
        clearAuthSession();
        setIsCheckingAuth(false);
        navigate(`/login?action=logout&reason=logged_out&system=${encodeURIComponent(originSystem)}`, { replace: true });
        return;
      }

      // Accounts tied to MORE than one system return to the Landing Page (/portal) so they can switch systems.
      // Auto-redirect is suppressed so they remain on /portal and can choose an authorized system.
      setSession(currentSession);
      setIsCheckingAuth(false);
      return;
    }

    // 5. Direct navigation to /portal (e.g. user manually opens /portal while logged in)
    if (isSingleSystem) {
      redirectToSubsystem(singleSubsystem, currentSession);
      return;
    }

    setSession(currentSession);
    setIsCheckingAuth(false);
  }, [navigate]);

  const handleSystemSelect = (systemKey: SystemKey) => {
    // Ensure we retrieve latest session data from storage or state
    const currentSession = session || getStoredAuthSession();
    redirectToSubsystem(systemKey, currentSession);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login?action=logout&reason=logged_out', { replace: true });
  };

  const handlePublicHome = () => {
    navigate('/');
  };

  if (isCheckingAuth || !session) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#FFFFFF',
        fontFamily: 'var(--fb, system-ui, sans-serif)',
        gap: '16px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(0, 169, 157, 0.2)',
          borderTopColor: '#00A99D',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: '15px', color: '#94A3B8' }}>Verifying authentication...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const profile = {
    name: session.employeeName || 'Staff Member',
    role: session.userRole || 'Staff',
    avatarInitials: getAvatarInitials(session.employeeName),
    employeeId: session.employeeId,
  };

  return (
    <SystemSelectorPage
      profile={profile}
      allowedSystems={session.allowedSystems}
      onSelect={handleSystemSelect}
      onPublicHome={handlePublicHome}
      onLogout={handleLogout}
    />
  );
};

export default PortalPage;
