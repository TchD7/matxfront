import { useState, useEffect } from 'react';
import { HiOutlineUserCircle } from "react-icons/hi2";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  VStack,
  Button,
  HStack,
  Text,
  Box,
  Image,
  Center,
  useColorModeValue,
} from '@chakra-ui/react';
import api from '../../api/apiClient';
import MatxLogo from '../../assets/matx-logo.svg';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Récupération du username
  const params = new URLSearchParams(location.search);
  const username =
    params.get('username') ||
    (location.state as any)?.username ||
    localStorage.getItem('login_username') ||
    '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sent, setSent] = useState(false);

  // Guard : redirection si pas de username
  useEffect(() => {
    if (!username) {
      navigate('/', { replace: true });
    } else {
      localStorage.setItem('login_username', username);
    }
  }, [username, navigate]);

  // Optionnel : Vérifier si l'utilisateur existe au chargement
useEffect(() => {
  if (!username) return;

  const checkUserExistence = async () => {
    try {
      await api.post('/api/v1/customers/users/check-credentials/', {
        credential: username
      });
    } catch (err) {
      console.warn("Utilisateur non trouvé ou erreur de tenant.");
    }
  };

  checkUserExistence();
}, [username]);
  // Envoi du reset
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sent) return; 

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Correction de l'URL pour correspondre à ton nouveau Serializer/View
      // L'instance 'api' utilisera le tenant actuel (ex: snpt.localhost)
      const res = await api.post('/api/v1/customers/auth/forgot-password/', { 
        username 
      });

      // Le serializer renvoie "detail" avec l'email masqué
      setSuccess(res.data.detail);
      setSent(true); 
    } catch (err: any) {
      console.error(err);
      
      // Gestion de la 404 ou erreur de validation du Serializer
      if (err.response?.status === 404) {
        setError("Le service de réinitialisation est indisponible (Route 404).");
      } else {
        setError(
          err.response?.data?.detail || 
          err.response?.data?.username?.[0] || // Pour les erreurs de validation serializer
          "Une erreur est survenue, veuillez réessayer."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.700');
  const pageBg = useColorModeValue('gray.50', 'gray.800');

  return (
    <Center minH="100vh" bg={pageBg} px={4}>
      <Box maxW="400px" w="full" p={8} bg={bgColor} shadow="lg" borderRadius="xl">
        <VStack spacing={6}>
          <Image src={MatxLogo} alt="Matx Logo" htmlWidth="160px" />
          
          <HStack spacing={2} justify="center" bg="gray.50" py={2} px={4} borderRadius="full">
            <HiOutlineUserCircle size="20px" color="gray" />
            <Text fontWeight="bold" fontSize="sm">{username}</Text>
          </HStack>

          {!sent ? (
            <>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Cliquez sur le bouton ci-dessous pour recevoir un lien de réinitialisation sécurisé pour votre compte.
              </Text>

              <form style={{ width: '100%' }} onSubmit={handleSubmit}>
                <Button
                  type="submit"
                  colorScheme="purple"
                  width="full"
                  isLoading={loading}
                  size="lg"
                  fontSize="md"
                >
                  Recevoir mon lien
                </Button>
              </form>
            </>
          ) : (
            <Box bg="green.50" p={4} borderRadius="md" w="full">
              <Text fontSize="sm" color="green.700" textAlign="center" fontWeight="medium">
                {success || "E-mail de réinitialisation envoyé !"}
              </Text>
            </Box>
          )}

          {error && (
            <Text color="red.500" fontSize="xs" textAlign="center" bg="red.50" p={2} borderRadius="md" w="full">
              {error}
            </Text>
          )}

          <Button
            onClick={() => navigate('/')}
            colorScheme="purple"
            variant="link"
            size="sm"
          >
            Retour à la connexion
          </Button>
        </VStack>
      </Box>
    </Center>
  );
}