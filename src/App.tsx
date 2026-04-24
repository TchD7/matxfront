import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from "./pages/Dashboard"; 
import LoginPage from "./pages/LoginPage";
import LoginPassword from "./components/forms/LoginPassword";
import ResetPassword from './components/forms/ResetPassword';
import ResetPasswordToken from './components/forms/ResetPasswordToken';
import AcceptInvitation from './pages/AcceptInvitation';
import InternetDetector from './components/forms/InternetDetector';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <Router>
      <InternetDetector />
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<LoginPage />} /> 
        <Route path="/login-password" element={<LoginPassword />} />
        
        {/* Routes protégées - accessibles uniquement si l'utilisateur est authentifié */}
        <Route 
          path="/dashboard" 
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } 
        />
        
        {/* Routes de réinitialisation de mot de passe */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPasswordToken />} />
        
        {/* Route d'acceptation d'invitation */}
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
      </Routes>
    </Router>
  );
}

export default App;
