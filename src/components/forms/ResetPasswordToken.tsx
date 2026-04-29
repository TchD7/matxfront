import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  VStack,
  useColorModeValue,
  Text,
  Box,
  Image,
  Center,
  Spinner,
  FormControl,
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

export default function ResetPasswordToken() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [clientLogo, setClientLogo] = useState<string>(MatxLogo); // ✅ Ajouter state pour logo client

  const bgColor = useColorModeValue('white', 'gray.700');
  const pageBg = useColorModeValue('gray.50', 'gray.800');

  // 1. Vérification de la validité du token au chargement (GET)
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (!token) {
        setMessage("Lien manquant.");
        setVerifying(false);
        return;
      }

      try {
        // GET pour vérifier si le token existe et n'est pas expiré
        const config: any = { skipAuth: true };
        const res = await api.get(`/api/v1/customers/auth/accept-invitation/${token}/`, config);
        
        // ✅ Extraire le logo du client depuis la réponse
        const data = res.data.data || res.data;
        if (data?.client_logo) {
          setClientLogo(data.client_logo);
          console.log('🖼️ Logo du client chargé:', data.client_logo);
        }
        
        setTokenValid(true);
      } catch (err: any) {
        setTokenValid(false);
        // ✅ Utiliser extractErrorMessage pour respecter le contrat API
        const errorMsg = extractErrorMessage(err);
        setMessage(errorMsg);
        console.error('❌ Erreur lors de la vérification du token:', errorMsg);
      } finally {
        setVerifying(false);
      }
    };

    checkTokenValidity();
  }, [token]);

  // 2. Soumission du nouveau mot de passe (POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== password2) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // On envoie le password ET le token (attendu par InvitationAcceptSerializer)
      const config: any = { skipAuth: true };
      await api.post(
        `/api/v1/customers/auth/accept-invitation/${token}/`,
        { 
          token: token, // Requis par ton InvitationAcceptSerializer
          password: password, 
          password2: password2 
        },
        config
      );

      setMessage('Succès ! Votre mot de passe a été configuré avec succès.');
      setTokenValid(false); // Cache le formulaire pour montrer le message de succès
      
      // Redirection vers login après succès
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', err);
      
      // ✅ Utiliser extractErrorMessage pour respecter le contrat API
      // Cela respecte la priorité: detail > premier champ erreur > fallback
      const errorMsg = extractErrorMessage(err);
      
      setMessage(errorMsg);
      console.error('💾 Message d\'erreur du backend:', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // État de chargement initial (vérification du token)
  if (verifying) {
    return (
      <Center minH="100vh" bg={pageBg}>
        <VStack spacing={4}>
          <Spinner color="purple.500" size="xl" thickness="4px" />
          <Text color="gray.500" fontWeight="medium">Vérification de sécurité...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Center minH="100vh" bg={pageBg} px={4}>
      <Box maxW="400px" w="full" p={8} bg={bgColor} shadow="2xl" borderRadius="2xl">
        <VStack spacing={6}>
          {/* ✅ Afficher le logo du client au lieu de MatxLogo */}
          <Image src={clientLogo} alt="Client Logo" htmlWidth="140px" />
          
          <Text fontSize="lg" fontWeight="bold" textAlign="center" color="gray.700">
            {tokenValid ? "Réinitialisation" : "Lien expiré"}
          </Text>

          {message && (
            <Box 
              w="full" 
              p={3} 
              borderRadius="lg" 
              bg={message.includes('Succès') ? "green.50" : "red.50"}
              border="1px solid"
              borderColor={message.includes('Succès') ? "green.200" : "red.200"}
            >
              <Text 
                color={message.includes('Succès') ? "green.600" : "red.600"} 
                fontSize="sm" 
                textAlign="center"
                fontWeight="medium"
              >
                {message}
              </Text>
            </Box>
          )}

          {!tokenValid ? (
            <Button 
              onClick={() => navigate('/')} 
              colorScheme="purple" 
              w="full"
              variant="solid"
              size="lg"
            >
              Retour à la connexion
            </Button>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    size="lg"
                    autoComplete="new-password"
                    focusBorderColor="purple.400"
                    bg="gray.50"
                  />
                </FormControl>

                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    size="lg"
                    autoComplete="new-password"
                    focusBorderColor="purple.400"
                    bg="gray.50"
                  />
                </FormControl>

                <Button 
                  type="submit" 
                  colorScheme="purple" 
                  isLoading={loading} 
                  width="full"
                  size="lg"
                  mt={2}
                  shadow="md"
                >
                  Valider le mot de passe
                </Button>

                <Button 
                  onClick={() => navigate('/')} 
                  variant="ghost" 
                  size="sm" 
                  color="gray.400"
                  w="full"
                  _hover={{ bg: 'transparent', color: 'purple.500' }}
                >
                  Annuler
                </Button>
              </VStack>
            </form>
          )}
        </VStack>
      </Box>
    </Center>
  );
}