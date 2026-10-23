import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import { ADMIN_PROFILE, SYSTEMS_LIST } from '../data/mockData';
import { getStoredAuthSession, clearAuthSession, getAvatarInitials } from '../utils/auth';
import { checkRateLimit } from '../utils/rateLimiter';

export const DashboardLayoutShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getStoredAuthSession();

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
      }
    }
  }, [session, navigate]);

  const profile = session ? {
    name: session.employeeName || 'Staff Member',
    role: session.userRole || 'Staff',
    avatarInitials: getAvatarInitials(session.employeeName),
  } : ADMIN_PROFILE;
  
  // Extract system key from the URL path, e.g. "/dms/dashboard" -> "dms"
  const currentSystem = location.pathname.split('/')[1] || 'dms';

  const handleSystemChange = (key: string) => {
    navigate(`/${key}/dashboard`);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
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
            systems: SYSTEMS_LIST,
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
