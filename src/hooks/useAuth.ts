import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook personnalisé pour accéder aux fonctions et données d'authentification
 * @returns {Object} Contexte d'authentification avec user, login, logout et isLoading
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  return context;
}

export default useAuth;
