import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!username) {
      console.warn('❌ LoginPassword: Pas de username fourni');
      toast({
        title: 'Erreur de session',
        description: 'Veuillez recommencer depuis la page de connexion',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // Rediriger après une courte attente pour que le toast soit visible
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    }
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
      console.log('🔐 Tentative de connexion pour:', username);
      
      // 1. Authentification centrale
      const res = await api.post('/api/v1/customers/auth/login/', {
        username,
        password,
      });
      
      const data = res.data;
      console.log('Authentification réussie');

      // 2. Mise à jour des jetons JWT de manière sécurisée
      // Access token court terme + refresh token long terme
      setTokens(data.access, data.refresh || null);
      login(data.user, data.access);
      
      // On switch l'URL d'Axios vers le domaine du client (ex: client1.api.com)
      if (data.tenant_domain) {
        console.log('🔄 Mise à jour du domaine tenant:', data.tenant_domain);
        updateApiBaseURL(data.tenant_domain);
      }

      // 3. Établir la session sur le domaine du tenant
      if (data.tenant_url) {
        try {
          console.log('📡 Établissement de la session sur:', data.tenant_url);
          await axios.get(`${data.tenant_url}/api/v1/customers/auth/session-establish/`, {
            headers: {
              'Authorization': `Bearer ${data.access}` 
            },
            withCredentials: true,
            timeout: 5000,
          });
          console.log('✅ Session établie avec succès');
        } catch (sessionErr: any) {
          console.error('❌ Erreur lors de l\'établissement de session:', sessionErr);
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
          // On continue quand même mais on affiche l'erreur
        }
      }

      // 4. Nettoyage et navigation interne
      sessionStorage.removeItem('login_username');
      sessionStorage.removeItem('keep_signed_in');
      
      console.log('✅ Connexion réussie, redirection vers /dashboard');
      toast({
        title: 'Connexion réussie',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      console.error('❌ Erreur lors de la connexion:', err);
      
      let errorMsg = 'Erreur inconnue';
      
      if (err.response?.status === 401) {
        errorMsg = 'Mot de passe incorrect';
      } else if (err.response?.status === 404) {
        errorMsg = 'Utilisateur non trouvé';
      } else if (err.response?.status === 429) {
        errorMsg = 'Trop de tentatives, réessayez plus tard';
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.data?.username) {
        errorMsg = err.response.data.username[0] || 'Erreur d\'authentification';
      } else if (err.message === 'Network Error') {
        errorMsg = 'Erreur réseau: Impossible de contacter le serveur';
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Timeout: Le serveur met trop longtemps à répondre';
      } else {
        errorMsg = err.response?.data?.message || 'Erreur serveur ou domaine introuvable';
      }
      
      setError(errorMsg);
      console.error('💾 Message d\'erreur:', errorMsg);
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