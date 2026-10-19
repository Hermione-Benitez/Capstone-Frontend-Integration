import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components";
import ToastContainer from "./components/ToastContainer";
import DashboardLayoutShell from "./layouts/DashboardLayoutShell";

// Lazy-load public website, portal & system dashboards
const PublicWebsite = lazy(() => import("./pages/PublicWebsite"));
const PortalPage = lazy(() => import("./pages/PortalPage"));
const SharedDashboard = lazy(() => import("./pages/SharedDashboard"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const PrivacyNoticePage = lazy(() => import("./pages/PrivacyNoticePage"));
const EmailVerificationPage = lazy(() => import("./pages/EmailVerificationPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

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

        {/* Unified Central Authentication & Onboarding Gateway */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/privacy-notice" element={<PrivacyNoticePage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />

        {/* Post-Login Subsystem Selector Homepage & Aliases */}
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/home" element={<PortalPage />} />
        <Route path="/selector" element={<PortalPage />} />
        <Route path="/systems" element={<PortalPage />} />

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
