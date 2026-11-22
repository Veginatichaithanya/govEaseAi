import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GovernmentAuthProvider } from './context/GovernmentAuthContext';
import CitizenProtectedRoute from './components/CitizenProtectedRoute';
import PageLoadingSpinner from './components/PageLoadingSpinner';
import { pingApiHealth } from './services/apiClient';

// Lazy-loaded route components for high performance, code-splitting, and fast page load
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CitizenDashboardPage = lazy(() => import('./pages/CitizenDashboardPage'));
const ApplicationFormPage = lazy(() => import('./pages/ApplicationFormPage'));
const DocumentsPlaceholderPage = lazy(() => import('./pages/DocumentsPlaceholderPage'));
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage'));
const ApplicationDetailsPage = lazy(() => import('./pages/ApplicationDetailsPage'));
const DigitalApprovalPage = lazy(() => import('./pages/DigitalApprovalPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const OfficerLoginPage = lazy(() => import('./pages/officer/OfficerLoginPage'));
const OfficerDashboardPage = lazy(() => import('./pages/officer/OfficerDashboardPage'));
const OfficerReviewPage = lazy(() => import('./pages/officer/OfficerReviewPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));

// Helper component to handle top scroll or hash navigation
const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const scrollToHashElement = () => {
        const el = document.getElementById(targetId);
        if (el) {
          const navHeight = 72;
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: Math.max(0, elementPosition - navHeight - 16),
            behavior: 'smooth'
          });
        }
      };

      scrollToHashElement();
      const t1 = setTimeout(scrollToHashElement, 80);
      const t2 = setTimeout(scrollToHashElement, 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

export const App: React.FC = () => {
  // Silent initial backend warmup ping on application start (spins up sleeping Render instances)
  useEffect(() => {
    pingApiHealth(15000).catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <GovernmentAuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoadingSpinner />}>
              <Routes>
                {/* ── Citizen Portal Public Routes ── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* ── Citizen Portal Protected Routes ── */}
                <Route path="/dashboard" element={<CitizenProtectedRoute><CitizenDashboardPage /></CitizenProtectedRoute>} />
                <Route path="/services" element={<CitizenProtectedRoute><ServicesPage /></CitizenProtectedRoute>} />
                <Route path="/services/:serviceId" element={<CitizenProtectedRoute><ServiceDetailPage /></CitizenProtectedRoute>} />
                <Route path="/applications" element={<CitizenProtectedRoute><MyApplicationsPage /></CitizenProtectedRoute>} />
                <Route path="/applications/new/:serviceId" element={<CitizenProtectedRoute><ApplicationFormPage /></CitizenProtectedRoute>} />
                <Route path="/applications/:applicationId/documents" element={<CitizenProtectedRoute><DocumentsPlaceholderPage /></CitizenProtectedRoute>} />
                <Route path="/applications/:applicationId/approval" element={<CitizenProtectedRoute><DigitalApprovalPage /></CitizenProtectedRoute>} />
                <Route path="/applications/:applicationId" element={<CitizenProtectedRoute><ApplicationDetailsPage /></CitizenProtectedRoute>} />
                <Route path="/assistant" element={<CitizenProtectedRoute><AIAssistantPage /></CitizenProtectedRoute>} />
                <Route path="/services/:serviceId/assistant" element={<CitizenProtectedRoute><AIAssistantPage /></CitizenProtectedRoute>} />
                <Route path="/applications/:applicationId/assistant" element={<CitizenProtectedRoute><AIAssistantPage /></CitizenProtectedRoute>} />

                <Route path="/notifications" element={<CitizenProtectedRoute><NotificationsPage /></CitizenProtectedRoute>} />
                <Route path="/profile" element={<CitizenProtectedRoute><ProfilePage /></CitizenProtectedRoute>} />
                <Route path="/settings" element={<CitizenProtectedRoute><SettingsPage /></CitizenProtectedRoute>} />

                {/* ── Government Officer Portal (Single Login & Department-Aware Dashboard) ── */}
                <Route path="/officer" element={<OfficerDashboardPage />} />
                <Route path="/officer/login" element={<OfficerLoginPage />} />
                <Route path="/officer/dashboard" element={<OfficerDashboardPage />} />
                <Route path="/officer/applications" element={<OfficerDashboardPage />} />
                <Route path="/officer/notifications" element={<OfficerDashboardPage />} />
                <Route path="/officer/profile" element={<OfficerDashboardPage />} />
                <Route path="/officer/applications/:applicationId" element={<OfficerReviewPage />} />
                <Route path="/officer/applications/:applicationId/approval" element={<DigitalApprovalPage />} />

                {/* Duplicate/legacy government routes redirected to the single officer portal */}
                <Route path="/government/login" element={<Navigate to="/officer/login" replace />} />
                <Route path="/government/*" element={<Navigate to="/officer/dashboard" replace />} />

                {/* ── Central Administration & Stats Dashboard ── */}
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

                <Route path="*" element={<LandingPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </GovernmentAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
