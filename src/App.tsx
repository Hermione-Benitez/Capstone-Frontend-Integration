import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastProvider } from "./components";
import ToastContainer from "./components/ToastContainer";
import DashboardLayoutShell from "./layouts/DashboardLayoutShell";
import { getStarsLoginUrl, redirectToStarsLogin } from "./utils/auth";

// Lazy-load public website, portal & system dashboards
const PublicWebsite = lazy(() => import("./pages/PublicWebsite"));
const PortalPage = lazy(() => import("./pages/PortalPage"));
const SharedDashboard = lazy(() => import("./pages/SharedDashboard"));
const LoginPage = lazy(() => import("./pages/LoginPage/LoginPage"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  React.useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, hash]);

  return null;
}

function ExternalLoginRedirect() {
  const loginUrl = getStarsLoginUrl('/portal');

  React.useEffect(() => {
    redirectToStarsLogin('/portal');
  }, []);

  return (
    <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "var(--fb, sans-serif)" }}>
      <h2>Redirecting to Speedex Authentication Portal...</h2>
      <p style={{ color: "var(--tt, #6B7280)" }}>
        If you are not redirected automatically,{" "}
        <a href={loginUrl} style={{ color: "var(--teal, #00A99D)", fontWeight: 600 }}>
          click here to continue
        </a>.
      </p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--navy, #1B254B)", fontFamily: "var(--fb, sans-serif)" }}>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>Loading Speedex Portal...</div>
        </div>
      }
    >
      <Routes>
        {/* Public Facing Website (Speedex Landing & Tracking) */}
        <Route path="/" element={<PublicWebsite />} />

        {/* Post-Login Subsystem Selector Homepage & Aliases */}
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/home" element={<PortalPage />} />
        <Route path="/selector" element={<PortalPage />} />
        <Route path="/systems" element={<PortalPage />} />

        {/* Authentication Gateway — branded split-layout login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Micro-Frontend Shells (Shared Sidebar/Header) */}
        <Route path="/dms/*" element={<DashboardLayoutShell />}>
          <Route path="*" element={<SharedDashboard />} />
        </Route>

        <Route path="/stars/*" element={<DashboardLayoutShell />}>
          <Route path="*" element={<SharedDashboard />} />
        </Route>

        <Route path="/foms/*" element={<DashboardLayoutShell />}>
          <Route path="*" element={<SharedDashboard />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<PublicWebsite />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
