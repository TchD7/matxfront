import { 
  Box, VStack, Text, Divider, Avatar, Spinner, Center, HStack, Badge, Container, Button 
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { RiArrowLeftLine } from 'react-icons/ri';
import api from '../../api/apiClient';

interface UserDetailsProps {
  userId?: string | number | null; // Si présent, charge cet ID, sinon charge le profil connecté "me"
  onBack?: () => void; // Fonction passée par le Dashboard pour retourner à la liste
}

export default function UserDetails({ userId, onBack }: UserDetailsProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // Logique de l'URL : si on a un userId on vise l'ID, sinon on vise l'utilisateur actuel
        const url = userId 
          ? `/api/v1/customers/users/${userId}/` 
          : '/api/v1/customers/users/me/';
        
        const res = await api.get(url);
        setUser(res.data);
      } catch (err) {
        console.error("Erreur chargement détails utilisateur:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (loading) return (
    <Center h="200px">
      <Spinner color="purple.500" size="xl" />
    </Center>
  );

  return (
    <Container maxW="container.md" py={6}>
      {/* Le bouton Retour n'apparaît que si on consulte un utilisateur depuis la liste */}
      {onBack && (
        <Button 
          leftIcon={<RiArrowLeftLine />} 
          variant="outline" 
          mb={6} 
          onClick={onBack}
          colorScheme="purple"
          size="sm"
          _hover={{ bg: "purple.50" }}
        >
          Retour à la liste
        </Button>
      )}

      <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="lg" shadow="md" borderWidth="1px">
        {/* En-tête du profil avec Avatar et Badges */}
        <HStack spacing={{ base: 4, md: 6 }} mb={8} align="center">
          <Avatar 
            size="2xl" 
            name={`${user?.first_name} ${user?.last_name}`} 
            bg="purple.500" 
            color="white"
          />
          <Box>
            <Text fontSize={{ base: "xl", md: "3xl" }} fontWeight="bold" color="gray.800">
              {user?.first_name} {user?.last_name}
            </Text>
            <HStack spacing={3} mt={2} display="flex" flexWrap="wrap">
              <Badge colorScheme="purple" px={2} py={1} borderRadius="md" variant="subtle">
                {user?.role?.toUpperCase()}
              </Badge>
              <Badge 
                colorScheme={user?.can_login_web ? "green" : "red"} 
                px={2} py={1} 
                borderRadius="md"
                variant="solid"
              >
                {user?.can_login_web ? "ACCÈS WEB OK" : "ACCÈS WEB NO"}
              </Badge>
            </HStack>
          </Box>
        </HStack>

        {/* Section des détails */}
        <VStack align="start" spacing={6}>
          <DetailItem label="NOM D'UTILISATEUR" value={user?.username} />
          <DetailItem label="ADRESSE EMAIL" value={user?.email} />
          <DetailItem label="TÉLÉPHONE" value={user?.phone_number || "Non renseigné"} />
          <DetailItem label="CODE ÉQUIPE" value={user?.team_code || "Aucune équipe assignée"} />
        </VStack>
      </Box>
    </Container>
  );
}

/**
 * Composant interne pour l'affichage propre de chaque ligne d'information
 */
function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <Box w="full">
      <Text fontSize="xs" color="gray.500" fontWeight="extrabold" letterSpacing="wider">
        {label}
      </Text>
      <Text fontSize="md" color="gray.700" mt={1}>
        {value}
      </Text>
      <Divider mt={3} opacity={0.6} />
    </Box>
  );
}