import { createContext, useState, useEffect, useMemo, useContext } from 'react'; // 🟢 Ajout de useContext ici
import { flushSync } from 'react-dom';
import type { ReactNode } from 'react';
import { getAccessToken, clearTokens } from '../api/apiClient';
import axios from 'axios';

interface AuthContextType {
  user: any | null;
  login: (userData: any, token?: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => { },
  logout: () => { },
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = getAccessToken();
        const storedUser = localStorage.getItem('user');

        if (accessToken && storedUser) {
          // Charger d'abord depuis le localStorage pour éviter le flicker
          setUser(JSON.parse(storedUser));

          // Puis actualiser les données du serveur pour s'assurer que les permissions sont à jour
          try {
            const baseURL = localStorage.getItem('tenant_api_url') || import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await axios.get(`${baseURL}/api/v1/customers/users/me/`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });

            const userData = response.data.data || response.data;
            if (userData) {
              // Mettre à jour avec les données fraîches du serveur
              localStorage.setItem('user', JSON.stringify(userData));
              setUser(userData);
            }
          } catch (err) {
            // Si la récupération du serveur échoue, garder les données du localStorage
            // (l'utilisateur peut toujours travailler avec les données en cache)
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: any, _token?: string) => {
    if (!userData) {
      throw new Error('userData manquante pour le login');
    }

    try {
      const userJson = JSON.stringify(userData);
      localStorage.setItem('user', userJson);
    } catch (e) {
      throw new Error('Impossible de sérialiser les données utilisateur');
    }

    flushSync(() => {
      setUser(userData);
    });
  };

  const logout = () => {
    clearTokens();
    localStorage.removeItem('user');
    localStorage.removeItem('jwt_access_token');
    localStorage.removeItem('jwt_refresh_token');
    localStorage.removeItem('tenant_api_url');
    setUser(null);
  };

  const isAuthenticated = !!user && !!getAccessToken();

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isLoading,
      isAuthenticated,
    }),
    [user, isLoading, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ================= HOOK PERSONNALISÉ =================
// 🟢 AJOUTÉ : Permet à TicketDetailPage de faire : const { user } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}