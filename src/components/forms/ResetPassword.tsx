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
  const [clientLogo, setClientLogo] = useState<string>(MatxLogo); // ✅ State pour logo client

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
      const res = await api.post('/api/v1/customers/users/check-credentials/', {
        credential: username
      });
      
      // ✅ Extraire le logo du client depuis la réponse
      const data = res.data.data || res.data;
      if (data?.client_logo) {
        setClientLogo(data.client_logo);
        console.log('🖼️ Logo du client chargé:', data.client_logo);
      }
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
      console.error('❌ Erreur lors de la réinitialisation de mot de passe:', err);
      
      // ✅ Utiliser extractErrorMessage pour respecter le contrat API
      // Cela respecte la priorité: detail > premier champ erreur > fallback
      const errorMsg = extractErrorMessage(err);
      
      setError(errorMsg);
      console.error('💾 Message d\'erreur du backend:', errorMsg);
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
          {/* ✅ Afficher le logo du client au lieu de MatxLogo */}
          <Image src={clientLogo} alt="Client Logo" htmlWidth="160px" />
          
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