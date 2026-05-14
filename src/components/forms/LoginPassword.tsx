import { useState, useEffect, useRef } from 'react';
import { HiOutlineUserCircle } from "react-icons/hi2";
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  VStack,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Box,
  Center,
  HStack,
  Image,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';

// Import de ton instance et des nouvelles fonctions
import api, { setTokens, updateApiBaseURL } from '../../api/apiClient';
import { useAuth } from '../../hooks/useAuth';
import MatxLogo from '../../assets/matx-logo.svg';

// ============================================================
// Extraction des messages d'erreur depuis le backend
// Respecte le contrat API strictement
// ============================================================
function extractErrorMessage(error: any): string {
  const data = error?.response?.data;

  if (!data) return "Erreur serveur";

  // Priorité 1: data.detail (erreur globale)
  if (data.detail) return data.detail;

  // Priorité 2: premier champ erreur (erreur par champ)
  const firstKey = Object.keys(data)[0];
  const firstValue = data[firstKey];

  if (Array.isArray(firstValue)) return firstValue[0];

  return firstValue || "Erreur inconnue";
}

export default function LoginPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth(); // ✅ Utiliser le contexte
  const params = new URLSearchParams(location.search);

  const username =
    params.get('username') ||
    sessionStorage.getItem('login_username') ||
    '';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionError, setSessionError] = useState('');
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!username) {
      toast({
        title: 'Erreur de session',
        description: 'Veuillez recommencer depuis la page de connexion',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    }

    // Cleanup : annuler la redirection programmée si le composant est unmount
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [username, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Mot de passe requis");
      return;
    }

    setLoading(true);
    setError('');
    setSessionError('');

    try {
      const res = await api.post('/api/v1/customers/auth/login/', {
        username,
        password,
      }, {
        skipAuth: true,
      });

      const data = res.data;
      const authData = data.data || data;

      if (!authData.access) {
        throw new Error('Access token manquant dans la réponse du backend');
      }
      if (!authData.user) {
        throw new Error('Données utilisateur manquantes');
      }

      setTokens(authData.access, authData.refresh || null);
      login(authData.user, authData.access);

      if (authData.tenant_url) {
        updateApiBaseURL(authData.tenant_url);

        try {
          await axios.get(`${authData.tenant_url}/api/v1/customers/auth/session-establish/`, {
            headers: {
              'Authorization': `Bearer ${authData.access}`
            },
            withCredentials: true,
            timeout: 5000,
          });
        } catch (sessionErr: any) {
          const errorMsg = sessionErr?.response?.data?.detail ||
            sessionErr?.response?.data?.message ||
            sessionErr?.message ||
            'Impossible d\'établir la session';
          setSessionError(`Session: ${errorMsg}`);

          toast({
            title: 'Avertissement',
            description: errorMsg,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }

      sessionStorage.removeItem('login_username');
      sessionStorage.removeItem('keep_signed_in');

      setTimeout(() => {
        toast({
          title: 'Connexion réussie',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }, 2000);



      navigationTimeoutRef.current = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 200);

    } catch (err: any) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center minH="100vh" p={4}>
      <Box
        maxW="400px"
        w="full"
        p={8}
        boxShadow="xl"
        borderRadius="2xl"
        bg="white"
        border="1px solid"
        borderColor="gray.100"
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={1}>
            <Image src={MatxLogo} alt="Matx Logo" htmlWidth="160px" />
          </VStack>

          {username && (
            <HStack spacing={1} justify="center" bg="gray.50" p={2} borderRadius="md">
              <HiOutlineUserCircle size="18px" />
              <Text fontWeight="medium">{username}</Text>
            </HStack>
          )}

          {sessionError && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">{sessionError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!error}>
                <FormLabel ml={1}>Mot de passe</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="lg"
                  focusBorderColor="purple.500"
                  placeholder="••••••••"
                  disabled={loading}
                />
                {error && <FormErrorMessage fontSize="sm">{error}</FormErrorMessage>}
              </FormControl>

              <Button
                type="submit"
                colorScheme="purple"
                width="full"
                size="lg"
                isLoading={loading}
                shadow="md"
              >
                Se connecter
              </Button>
            </VStack>
          </form>

          <Button
            variant="link"
            size="sm"
            color="gray.500"
            onClick={() => navigate(`/reset-password?username=${username}`)}
          >
            Mot de passe oublié ?
          </Button>
        </VStack>
      </Box>
    </Center>
  );
}