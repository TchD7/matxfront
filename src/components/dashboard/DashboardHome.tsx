import {
    Box,
    Text,
    VStack,
    Flex,
    SimpleGrid,
    Badge,
    Spinner,
    Center,
    HStack,
    useToast
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import api from '../../api/apiClient';

interface DashboardHomeProps {
    user: any;
}

// Interface pour typer les tickets reçus de l'API
interface Ticket {
    id: number;
    status: string;
    equipment?: {
        name: string;
    };
    intervention_type?: {
        name: string;
    };
    is_late: boolean;
}

export default function DashboardHome({ user }: DashboardHomeProps) {
    const [loading, setLoading] = useState(true);
    const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
    const [inProgressTickets, setInProgressTickets] = useState<Ticket[]>([]);
    const [lateTickets, setLateTickets] = useState<Ticket[]>([]);

    const toast = useToast();

    // =========================================================
    // FETCH DASHBOARD DATA
    // =========================================================
    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            // On appelle l'endpoint dashboard qui doit retourner { assigned: [], in_progress: [], late: [] }
            const res = await api.get('/api/v1/tickets/dashboard/');
            const data = res.data;

            setAssignedTickets(data.assigned || []);
            setInProgressTickets(data.in_progress || []);
            setLateTickets(data.late || []);
        } catch (error) {
            console.error("Erreur dashboard:", error);
            toast({
                title: 'Erreur de connexion',
                description: 'Impossible de charger les statistiques du tableau de bord',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // =========================================================
    // EFFECT
    // =========================================================
    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // =========================================================
    // STATUS COLOR HELPER
    // =========================================================
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'planned': return 'blue';
            case 'in_progress': return 'orange';
            case 'completed': return 'green';
            case 'closed': return 'purple';
            default: return 'gray';
        }
    };

    // =========================================================
    // LOADING UI
    // =========================================================
    if (loading) {
        return (
            <Center py={20}>
                <VStack spacing={4}>
                    <Spinner size="xl" color="purple.500" thickness="4px" />
                    <Text color="gray.500">Chargement de vos activités...</Text>
                </VStack>
            </Center>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================
    return (
        <VStack spacing={6} align="stretch" p={{ base: 2, md: 0 }}>

            {/* HEADER */}
            <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={4}
            >
                <Box>
                    <Text fontSize="2xl" fontWeight="bold">
                        Tableau de bord
                    </Text>
                    <Text color="gray.500">
                        Bienvenue, {user?.display_name || user?.username || 'Utilisateur'}
                    </Text>
                </Box>

            </Flex>

            {/* KPI CARDS */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                <StatCard title="Tickets assignés" count={assignedTickets.length} color="gray.700" />
                <StatCard title="En cours" count={inProgressTickets.length} color="orange.500" />
                <StatCard title="En retard" count={lateTickets.length} color="red.500" />
            </SimpleGrid>

            {/* TICKETS LISTS */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>

                {/* BLOC ASSIGNÉS */}
                <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
                    <Text mb={4} fontWeight="bold" fontSize="lg">Récemment assignés</Text>
                    <VStack align="stretch" spacing={3}>
                        {assignedTickets.length > 0 ? (
                            assignedTickets.slice(0, 5).map((ticket) => (
                                <TicketRow key={ticket.id} ticket={ticket} colorFunc={getStatusColor} />
                            ))
                        ) : (
                            <Center py={4}>
                                <Text color="gray.400" fontSize="sm">Aucun ticket en attente.</Text>
                            </Center>
                        )}
                    </VStack>
                </Box>

                {/* BLOC EN COURS */}
                <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
                    <Text mb={4} fontWeight="bold" fontSize="lg">Interventions en cours</Text>
                    <VStack align="stretch" spacing={3}>
                        {inProgressTickets.length > 0 ? (
                            inProgressTickets.slice(0, 5).map((ticket) => (
                                <TicketRow key={ticket.id} ticket={ticket} colorFunc={getStatusColor} />
                            ))
                        ) : (
                            <Center py={4}>
                                <Text color="gray.400" fontSize="sm">Aucune intervention active.</Text>
                            </Center>
                        )}
                    </VStack>
                </Box>

            </SimpleGrid>
        </VStack>
    );
}

// Composant Interne pour les Cartes de Stats
function StatCard({ title, count, color }: { title: string, count: number, color: string }) {
    return (
        <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
            <Text color="gray.500" fontSize="sm" fontWeight="medium">{title}</Text>
            <Text fontSize="3xl" fontWeight="bold" color={color}>
                {count}
            </Text>
        </Box>
    );
}

// Composant Interne pour les Lignes de Tickets
function TicketRow({ ticket, colorFunc }: { ticket: Ticket, colorFunc: (s: string) => string }) {
    return (
        <Flex
            justify="space-between"
            align="center"
            p={3}
            borderRadius="xl"
            bg="gray.50"
            _hover={{ bg: 'gray.100', transform: 'translateX(2px)' }}
            transition="all 0.2s"
            cursor="pointer"
        >
            <Box overflow="hidden">
                <HStack>
                    <Text fontWeight="bold" fontSize="sm">#{ticket.id}</Text>
                    {ticket.is_late && (
                        <Badge colorScheme="red" variant="filled" fontSize="10px">RETARD</Badge>
                    )}
                </HStack>
                <Text fontSize="xs" color="gray.600" noOfLines={1}>
                    {ticket.equipment?.name || 'Équipement non spécifié'}
                </Text>
            </Box>
            <Badge colorScheme={colorFunc(ticket.status)} borderRadius="full" px={2} fontSize="xs">
                {ticket.status.replace('_', ' ')}
            </Badge>
        </Flex>
    );
}