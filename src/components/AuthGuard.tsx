import { Spinner, Center, VStack, Text } from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAccessToken } from '../api/apiClient';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Composant AuthGuard - Protège les routes en vérifiant l'authentification
 * Affiche un spinner pendant le chargement, redirige vers / si non authentifié
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [localUser, setLocalUser] = useState<any | null>(null);

  // ✅ Au montage, vérifier le localStorage directement
  // C'est un filet de sécurité si le contexte est en retard
  useEffect(() => {
    if (!user) {
      const userJson = localStorage.getItem('user');
      
      if (userJson) {
        try {
          // ✅ Valider que ce n'est pas la chaîne littérale "undefined"
          if (userJson === 'undefined' || userJson === 'null') {
            return;
          }
          
          const parsed = JSON.parse(userJson);
          setLocalUser(parsed);
        } catch (e) {
          // Ignorer silencieusement
        }
      }
    }
  }, [user]);

  // ✅ Affiche le spinner PENDANT que isLoading est true
  if (isLoading) {
    return (
      <Center height="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner 
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="purple.500"
            size="xl"
          />
          <Text color="gray.600" fontSize="sm">
            Vérification de votre session...
          </Text>
        </VStack>
      </Center>
    );
  }

  // ✅ Une fois isLoading = false, on vérifie si user existe (contexte ou localStorage)
  const authenticatedUser = user || localUser;
  const hasAccessToken = !!getAccessToken();
  
  if (!authenticatedUser || !hasAccessToken) {
    return <Navigate to="/" replace />;
  }

  // ✅ Utilisateur authentifié, affiche le contenu
  return <>{children}</>;
}

export default AuthGuard;

