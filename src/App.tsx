import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ToastProvider } from "./components";
import ToastContainer from "./components/ToastContainer";
import SystemSelectorPage from "./components/SystemSelectorPage";
import { ADMIN_PROFILE } from "./data/mockData";
import DashboardLayoutShell from "./layouts/DashboardLayoutShell";

// Lazy-load the system dashboards to implement Code Splitting
const SharedDashboard = lazy(() => import("./pages/SharedDashboard"));

function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading System...</div>}>
      <Routes>
        {/* Landing Page */}
        <Route 
          path="/" 
          element={
            <SystemSelectorPage
              profile={ADMIN_PROFILE}
              onSelect={(key) => navigate(`/${key}/dashboard`)} 
            />
          } 
        />

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
