import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ToastProvider } from "./components";
import ToastContainer from "./components/ToastContainer";
import SystemSelectorPage from "./components/SystemSelectorPage";
import { ADMIN_PROFILE } from "./data/mockData";
import DashboardLayoutShell from "./layouts/DashboardLayoutShell";

// Lazy-load public website & system dashboards
const PublicWebsite = lazy(() => import("./pages/PublicWebsite"));
const SharedDashboard = lazy(() => import("./pages/SharedDashboard"));

function ExternalLoginRedirect() {
  React.useEffect(() => {
    window.location.href = "https://stars-two-chi.vercel.app/";
  }, []);
  return (
    <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "var(--fb, sans-serif)" }}>
      <h2>Redirecting to Speedex Authentication Portal...</h2>
      <p style={{ color: "var(--tt, #6B7280)" }}>
        If you are not redirected automatically,{" "}
        <a href="https://stars-two-chi.vercel.app/" style={{ color: "var(--teal, #00A99D)", fontWeight: 600 }}>
          click here to continue
        </a>.
      </p>
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  const handleSystemSelect = (key: string) => {
    navigate(`/${key}/dashboard`);
  };

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

        {/* Post-Login System Selector Homepage */}
        <Route
          path="/home"
          element={
            <SystemSelectorPage
              profile={ADMIN_PROFILE}
              onSelect={handleSystemSelect}
              onPublicHome={() => navigate("/")}
              onLogout={() => navigate("/")}
            />
          }
        />
        <Route
          path="/selector"
          element={
            <SystemSelectorPage
              profile={ADMIN_PROFILE}
              onSelect={handleSystemSelect}
              onPublicHome={() => navigate("/")}
              onLogout={() => navigate("/")}
            />
          }
        />
        <Route
          path="/systems"
          element={
            <SystemSelectorPage
              profile={ADMIN_PROFILE}
              onSelect={handleSystemSelect}
              onPublicHome={() => navigate("/")}
              onLogout={() => navigate("/")}
            />
          }
        />

        {/* Authentication Gateway */}
        <Route path="/login" element={<ExternalLoginRedirect />} />

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
        <AppRoutes />
      </BrowserRouter>
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
