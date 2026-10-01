import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SystemSelectorPage, { type SystemKey } from '../components/SystemSelectorPage';
import {
  parseAuthHash,
  getStoredAuthSession,
  saveAuthSession,
  clearAuthSession,
  redirectToSubsystem,
  getAvatarInitials,
  type AuthSession,
} from '../utils/auth';

export const PortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // 1. Check if auth tokens are passed via URL hash
    const hashTokens = parseAuthHash(window.location.hash);

    if (hashTokens && hashTokens.authToken) {
      // Save tokens into localStorage
      saveAuthSession(hashTokens);

      // Clean the address bar without triggering page refresh
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 2. Validate current auth session from storage
    const currentSession = getStoredAuthSession();

    if (!currentSession || !currentSession.authToken) {
      // Unauthenticated user - redirect to public landing page
      setIsCheckingAuth(false);
      navigate('/', { replace: true });
      return;
    }

    setSession(currentSession);
    setIsCheckingAuth(false);
  }, [navigate]);

  const handleSystemSelect = (systemKey: SystemKey) => {
    // Redirect to subsystem with authentication hash
    redirectToSubsystem(systemKey, session);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/', { replace: true });
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
  };

  return (
    <SystemSelectorPage
      profile={profile}
      onSelect={handleSystemSelect}
      onPublicHome={handlePublicHome}
      onLogout={handleLogout}
    />
  );
};

export default PortalPage;
