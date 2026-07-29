import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import { ADMIN_PROFILE, SYSTEMS_LIST } from '../data/mockData';

export const DashboardLayoutShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract system key from the URL path, e.g. "/dms/dashboard" -> "dms"
  const currentSystem = location.pathname.split('/')[1] || 'dms';

  const handleSystemChange = (key: string) => {
    navigate(`/${key}`);
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <GlobalHeader
          title="Dashboard"
          profile={ADMIN_PROFILE}
          systemSwitcher={{
            currentSystem,
            systems: SYSTEMS_LIST,
            onSwitch: handleSystemChange,
          }}
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
