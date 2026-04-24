import { createContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getAccessToken } from '../api/apiClient';

interface AuthContextType {
  user: any | null;
  login: (userData: any, token?: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Vérifier si un token d'accès est disponible
        const accessToken = getAccessToken();
        const storedUser = localStorage.getItem('user');

        if (accessToken && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.warn('⚠️ Utilisateur stocké invalide, nettoyage');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('❌ Erreur initialisation auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: any, _token?: string) => {
    // Stocker l'utilisateur dans le contexte ET localStorage
    // Les tokens sont déjà sauvegardés par setTokens() dans apiClient
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // Nettoyer les données utilisateur
    // Les tokens sont gérés par l'apiClient
    localStorage.removeItem('user');
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
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}