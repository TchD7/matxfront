import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import LoginPassword from './components/forms/LoginPassword';
import ResetPassword from './components/forms/ResetPassword';
import ResetPasswordToken from './components/forms/ResetPasswordToken';
import AcceptInvitation from './pages/AcceptInvitation';
import TicketDetailPage from './pages/TicketDetailPage';

import InternetDetector from './components/forms/InternetDetector';
import AuthGuard from './components/AuthGuard';

import DashboardHome from './components/dashboard/DashboardHome';
import TicketManager from './components/dashboard/TicketManager';

import { updateApiBaseURL } from './api/apiClient';

function App() {
  useEffect(() => {
    const tenant = localStorage.getItem('tenant_api_url');

    if (tenant) {
      updateApiBaseURL(tenant);
    }
  }, []);

  return (
    <Router>
      <InternetDetector />

      <Routes>
        {/* ==========================
            ROUTES PUBLIQUES
        ========================== */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login-password" element={<LoginPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password-token" element={<ResetPasswordToken />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

        {/* ==========================
            DASHBOARD PROTÉGÉ
        ========================== */}

        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />

        <Route
          path="/dashboard/tickets/:id"
          element={
            <AuthGuard>
              <TicketDetailPage />
            </AuthGuard>
          }
        />

        {/* ==========================
            FALLBACK
        ========================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;