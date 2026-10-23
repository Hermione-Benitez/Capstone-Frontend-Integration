import React, { useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import { ADMIN_PROFILE, SYSTEMS_LIST } from '../data/mockData';
import { getStoredAuthSession, clearAuthSession, getAvatarInitials, isSubsystemAllowed } from '../utils/auth';
import { checkRateLimit } from '../utils/rateLimiter';

export const DashboardLayoutShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getStoredAuthSession();

  // Extract system key from the URL path, e.g. "/dms/dashboard" -> "dms"
  const currentSystem = location.pathname.split('/')[1] || 'dms';

  useEffect(() => {
    if (session?.employeeId) {
      const lockStatus = checkRateLimit(session.employeeId);
      if (lockStatus.isLocked) {
        clearAuthSession();
        navigate(`/locked-account?employeeId=${encodeURIComponent(session.employeeId)}`, {
          state: {
            employeeId: session.employeeId,
            remainingSeconds: lockStatus.remainingSeconds,
            lockedUntil: lockStatus.lockedUntil,
          },
          replace: true,
        });
        return;
      }

      // Guard against directly navigating to an unauthorized subsystem dashboard
      if (!isSubsystemAllowed(currentSystem, session)) {
        navigate('/portal', { replace: true });
      }
    }
  }, [session, currentSystem, navigate]);

  const profile = session ? {
    name: session.employeeName || 'Staff Member',
    role: session.userRole || 'Staff',
    avatarInitials: getAvatarInitials(session.employeeName),
  } : ADMIN_PROFILE;

  // Filter systems in the switcher to strictly authorized systems
  const authorizedSystemsList = useMemo(() => {
    return SYSTEMS_LIST.filter((sys) => isSubsystemAllowed(sys.key, session));
  }, [session]);

  const handleSystemChange = (key: string) => {
    if (isSubsystemAllowed(key, session)) {
      navigate(`/${key}/dashboard`);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login?action=logout&reason=logged_out', { replace: true });
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <GlobalHeader
          title="Dashboard"
          profile={profile}
          systemSwitcher={{
            currentSystem,
            systems: authorizedSystemsList,
            onSwitch: handleSystemChange,
          }}
          onLogout={handleLogout}
          onProfile={() => navigate('/portal')}
        />

        <main>
          {/* Outlet is where the React Router will inject the page content (e.g. DMS Dashboard) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayoutShell;
