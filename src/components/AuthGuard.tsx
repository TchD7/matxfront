import { Spinner, Center, VStack, Text } from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Composant AuthGuard - Protège les routes en vérifiant l'authentification
 * Affiche un spinner pendant le chargement, redirige vers / si non authentifié
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

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

  // ✅ Une fois isLoading = false, on vérifie si user existe
  if (!user) {
    console.warn('🔓 Accès refusé: pas d\'utilisateur authentifié');
    return <Navigate to="/" replace />;
  }

  // ✅ Utilisateur authentifié, affiche le contenu
  return <>{children}</>;
}

export default AuthGuard;

