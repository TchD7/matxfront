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
  FormErrorMessage,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import api from '../api/apiClient';
import MatxLogo from '../assets/matx-logo.svg';

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

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; password2?: string }>({});
  const [clientLogo, setClientLogo] = useState<string>(MatxLogo); // ✅ State pour logo client

  const bgColor = useColorModeValue('white', 'gray.700');
  const pageBg = useColorModeValue('gray.50', 'gray.800');

  // 1. Vérification de la validité du token au chargement
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (!token) {
        setMessage("Lien d'invitation manquant.");
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
        console.error('❌ Erreur lors de la vérification du token:', err);
        // ✅ Utiliser extractErrorMessage pour respecter le contrat API
        const errorMsg = extractErrorMessage(err);
        setMessage(errorMsg);
      } finally {
        setVerifying(false);
      }
    };

    checkTokenValidity();
  }, [token]);

  // Validation des mots de passe
  const validatePasswords = (): boolean => {
    const newErrors: { password?: string; password2?: string } = {};

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!password2) {
      newErrors.password2 = 'Veuillez confirmer le mot de passe';
    } else if (password !== password2) {
      newErrors.password2 = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 2. Soumission du nouveau mot de passe
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const config: any = { skipAuth: true };
      await api.post(
        `/api/v1/customers/auth/accept-invitation/${token}/`,
        {
          token: token,
          password: password,
          password2: password2,
        },
        config
      );

      setMessage('Succès ! Votre mot de passe a été configuré et votre invitation acceptée.');
      setTokenValid(false);

      // Redirection vers login après succès
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      console.error('❌ Erreur lors de la configuration du mot de passe:', err);
      // ✅ Utiliser extractErrorMessage pour respecter le contrat API
      const errorMsg = extractErrorMessage(err);
      setMessage(errorMsg);
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
      <Box maxW="420px" w="full" p={8} bg={bgColor} shadow="2xl" borderRadius="2xl">
        <VStack spacing={6}>
          {/* ✅ Afficher le logo du client au lieu de MatxLogo */}
          <Image src={clientLogo} alt="Client Logo" htmlWidth="160px" />

          <Text fontSize="lg" fontWeight="bold" textAlign="center" color="gray.700">
            {tokenValid ? "Accepter l'invitation" : "Invitation expirée"}
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

          {tokenValid && (
            <form style={{ width: '100%' }} onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Définissez votre mot de passe pour activer votre compte
                </Text>

                {/* Mot de passe */}
                <FormControl isInvalid={!!errors.password}>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) {
                          setErrors({ ...errors, password: '' });
                        }
                      }}
                      onBlur={() => {
                        if (password && password.length < 8) {
                          setErrors({
                            ...errors,
                            password: 'Le mot de passe doit contenir au moins 8 caractères',
                          });
                        }
                      }}
                      size="lg"
                      borderRadius="lg"
                      pr="2.5rem"
                    />
                    <InputRightElement width="2.5rem">
                      <Button
                        h="1.75rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                      >
                        {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
                </FormControl>

                {/* Confirmation du mot de passe */}
                <FormControl isInvalid={!!errors.password2}>
                  <InputGroup>
                    <Input
                      type={showPassword2 ? 'text' : 'password'}
                      placeholder="Confirmer le mot de passe"
                      value={password2}
                      onChange={(e) => {
                        setPassword2(e.target.value);
                        if (errors.password2) {
                          setErrors({ ...errors, password2: '' });
                        }
                      }}
                      onBlur={() => {
                        if (password2 && password !== password2) {
                          setErrors({
                            ...errors,
                            password2: 'Les mots de passe ne correspondent pas',
                          });
                        }
                      }}
                      size="lg"
                      borderRadius="lg"
                      pr="2.5rem"
                    />
                    <InputRightElement width="2.5rem">
                      <Button
                        h="1.75rem"
                        size="sm"
                        onClick={() => setShowPassword2(!showPassword2)}
                        variant="ghost"
                      >
                        {showPassword2 ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  {errors.password2 && <FormErrorMessage>{errors.password2}</FormErrorMessage>}
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="purple"
                  width="full"
                  isLoading={loading}
                  size="lg"
                  fontSize="md"
                >
                  Accepter l'invitation
                </Button>
              </VStack>
            </form>
          )}

          {!tokenValid && (
            <Button
              onClick={() => navigate('/')}
              colorScheme="purple"
              width="full"
              size="lg"
            >
              Retour à la connexion
            </Button>
          )}
        </VStack>
      </Box>
    </Center>
  );
}
