import {
    Box, Flex, Text, Input, InputGroup, InputLeftElement,
    Table, Thead, Tbody, Tr, Th, Td, Badge, Spinner, useToast,
    VStack, Center, Menu, MenuButton, MenuList, MenuItem,
    IconButton, FormControl, FormLabel, Select, HStack,
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ViewIcon } from '@chakra-ui/icons';
import { useEffect, useState, useCallback } from 'react';
import api from '../../api/apiClient';

// --- INTERFACES ---
interface Ticket {
    id: number;
    status: string;
    equipment_details?: { name: string };
    equipment_name?: string;
    technician_name?: string;
    planned_at?: string;
    is_late?: boolean;
}

interface Equipment {
    id: string; // UUID string
    name: string;
    code: string;
}

interface InterventionType {
    id: number;
    name: string;
}

interface TicketManagerProps {
    ticketRefreshTrigger?: number;
}

const getStatusDetails = (status: string) => {
    switch (status.toLowerCase()) {
        case 'draft':
            return { label: 'Qualifié', row: 'gray.50', badge: 'gray', border: 'gray.300', dot: 'gray.400' };
        case 'planned':
            return { label: 'Planifié', row: 'purple.50', badge: 'purple', border: 'purple.200', dot: 'purple.400' };
        case 'in_progress':
            return { label: 'En cours', row: 'blue.50', badge: 'blue', border: 'blue.200', dot: 'blue.400' };
        case 'completed':
            return { label: 'Terminé', row: 'green.50', badge: 'green', border: 'green.200', dot: 'green.400' };
        case 'closed':
            return { label: 'Clôturé', row: 'orange.50', badge: 'orange', border: 'orange.200', dot: 'orange.400' };
        default:
            return { label: status, row: 'transparent', badge: 'gray', border: 'transparent', dot: 'gray.200' };
    }
};

export default function TicketManager({ ticketRefreshTrigger }: TicketManagerProps) {
    const toast = useToast();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const url = search ? `/api/v1/tickets/?search=${search}` : '/api/v1/tickets/';
            const response = await api.get(url);
            const data = response.data.results || response.data;
            setTickets(Array.isArray(data) ? data : []);
        } catch (error: any) {
            toast({
                title: 'Erreur ' + (error.response?.status || ''),
                description: error.response?.data?.detail || 'Impossible de charger les tickets.',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [search, toast]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    useEffect(() => {
        if (ticketRefreshTrigger !== undefined) {
            fetchTickets();
        }
    }, [ticketRefreshTrigger, fetchTickets]);

    return (
        <VStack spacing={6} align="stretch" p={4}>
            {/* HEADER */}
            <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
                <Box>
                    <Text fontSize="2xl" fontWeight="bold">Interventions</Text>
                    <Text color="gray.500">Gestion des tickets de maintenance</Text>
                </Box>

                <HStack w={{ base: 'full', md: 'auto' }}>
                    <InputGroup maxW="300px">
                        <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
                        <Input
                            placeholder="Rechercher..."
                            bg="white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </InputGroup>
                </HStack>
            </Flex>

            {/* TABLEAU */}
/* --- 2. Ton composant de tableau amélioré --- */
            <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflowX="auto" shadow="sm">
                {loading ? (
                    <Center p={20}><Spinner size="xl" color="purple.500" /></Center>
                ) : (
                    <Table variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>Equipement</Th>
                                <Th>Technicien</Th>
                                <Th>Statut</Th>
                                <Th>Date</Th>
                                <Th textAlign="right">Actions</Th>
                            </Tr>
                        </Thead>

                        <Tbody>
                            {tickets.map((t) => {
                                const statusDetails = getStatusDetails(t.status);
                                return (
                                    <Tr
                                        key={t.id}
                                        bg={statusDetails.row}
                                        borderLeft="4px solid"
                                        borderLeftColor={statusDetails.border}
                                        _hover={{ filter: "brightness(0.97)" }}
                                        transition="0.2s"
                                    >
                                        <Td fontWeight="bold">{t.equipment_name || t.equipment_details?.name || 'N/A'}</Td>
                                        <Td>{t.technician_name || '-'}</Td>
                                        <Td>
                                            <Badge colorScheme={statusDetails.badge} borderRadius="full" px={3} variant="solid" fontSize="10px">
                                                {statusDetails.label} {/* Affichage en Français */}
                                            </Badge>
                                        </Td>
                                        <Td fontSize="sm">
                                            {t.planned_at
                                                ? new Date(t.planned_at).toLocaleString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })
                                                : '-'}
                                        </Td>
                                        <Td textAlign="right">
                                            <IconButton aria-label="Voir" icon={<ViewIcon />} size="sm" variant="ghost" colorScheme="purple" />
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>



                    </Table>
                )}
            </Box>
            {/* Barre de légende Flottante et Fixe */}
            <Flex
                position="fixed"
                bottom="30px"
                left="50%"
                transform="translateX(-50%)"
                bg="whiteAlpha.900"
                backdropFilter="blur(12px)"
                px={8}
                py={3}
                borderRadius="lg"
                boxShadow="0 8px 32px rgba(0,0,0,0.15)"
                border="1px solid"
                borderColor="gray.200"
                gap={6}
                zIndex={1000}
                align="center"
            >


                {[
                    { label: 'Qualifié', color: 'gray.400' },
                    { label: 'Planifié', color: 'purple.400' },
                    { label: 'En cours', color: 'blue.400' },
                    { label: 'Terminé', color: 'green.400' },
                    { label: 'Clôturé', color: 'orange.400' },
                ].map((item) => (
                    <Flex key={item.label} align="center" whiteSpace="nowrap">
                        <Box w={2} h={2} borderRadius="full" bg={item.color} mr={2} />
                        <Text fontSize="xs" fontWeight="bold" color="gray.600">{item.label}</Text>
                    </Flex>
                ))}
            </Flex>

        </VStack>
    );
}