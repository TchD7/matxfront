import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import LoginPassword from './components/forms/LoginPassword';
import ResetPassword from './components/forms/ResetPassword';
import ResetPasswordToken from './components/forms/ResetPasswordToken';
import AcceptInvitation from './pages/AcceptInvitation';
import TicketManager from './components/dashboard/TicketManager';
import TicketDetailPage from './pages/TicketDetailPage';

import InternetDetector from './components/forms/InternetDetector';
import AuthGuard from './components/AuthGuard';

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
            Utilisation de l'imbrication pour le layout
        ========================== */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        >
          {/* Ces routes enfants seront rendues automatiquement à l'intérieur 
            du composant Dashboard via le composant <Outlet /> 
          */}

          {/* ⬅️ AJOUT ICI : La route pour la liste des tickets */}
          <Route path="tickets" element={<TicketManager />} />

          <Route path="tickets/:id" element={<TicketDetailPage />} />

          {/* Vous pourrez ajouter ici d'autres routes enfants facilement : */}
          {/* <Route path="users" element={<UserManager />} /> */}
          {/* <Route path="users/:id" element={<UserDetails />} /> */}
        </Route>

        {/* ==========================
            FALLBACK
        ========================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;