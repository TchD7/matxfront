import { 
  Box, VStack, Text, Divider, Avatar, Spinner, Center, HStack, Badge, Container, Heading 
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import api from '../api/apiClient';

export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/v1/customers/users/me/');
                setUser(res.data);
            } catch (err) {
                console.error("Erreur profil:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) return <Center h="200px"><Spinner color="purple.500" /></Center>;

    return (
        <Container maxW="container.md" py={10}>
        
            <Box bg="white" p={8} borderRadius="xl" shadow="sm" borderWidth="1px">
                <HStack spacing={6} mb={8}>
                    <Avatar size="2xl" name={`${user?.first_name} ${user?.last_name}`} bg="purple.500" />
                    <Box>
                        <Text fontSize="3xl" fontWeight="bold">{user?.first_name} {user?.last_name}</Text>
                        <HStack spacing={3} mt={2}>
                            <Badge colorScheme="purple">{user?.role?.toUpperCase()}</Badge>
                            <Badge colorScheme={user?.can_login_web ? "green" : "red"}>
                                {user?.can_login_web ? "WEB OK" : "WEB NO"}
                            </Badge>
                        </HStack>
                    </Box>
                </HStack>

                <VStack align="start" spacing={5}>
                    <DetailItem label="NOM D'UTILISATEUR" value={user?.username} />
                    <DetailItem label="ADRESSE EMAIL" value={user?.email} />
                    <DetailItem label="TÉLÉPHONE" value={user?.phone_number || "Non renseigné"} />
                </VStack>
            </Box>
        </Container>
    );
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <Box w="full">
            <Text fontSize="xs" color="gray.500" fontWeight="bold">{label}</Text>
            <Text fontSize="lg">{value}</Text>
            <Divider mt={2} />
        </Box>
    );
}