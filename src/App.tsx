import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import LoginPassword from "./components/forms/LoginPassword";
import ResetPassword from './components/forms/ResetPassword';
import ResetPasswordToken from './components/forms/ResetPasswordToken';
import AcceptInvitation from './pages/AcceptInvitation';
import TicketDetailPage from './pages/TicketDetailPage';
import InternetDetector from './components/forms/InternetDetector';
import AuthGuard from './components/AuthGuard';
import { useEffect } from 'react';
import { updateApiBaseURL } from './api/apiClient';

function App() {
  useEffect(() => {
    const tenant = localStorage.getItem('tenant_api_url');

    if (tenant) {
      //console.log('🏢 Restoration tenant App boot:', tenant);
      updateApiBaseURL(tenant);
    } else {
      //console.log('📍 Aucun tenant → backend central');
    }
  }, []);

  return (
    <Router>
      <InternetDetector />
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login-password" element={<LoginPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password-token" element={<ResetPasswordToken />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />


        {/* Routes protégées - accessibles uniquement si l'utilisateur est authentifié */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />

        {/* Route détail ticket */}
        <Route
          path="/tickets/:id"
          element={
            <AuthGuard>
              <TicketDetailPage />
            </AuthGuard>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
