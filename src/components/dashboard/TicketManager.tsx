import {
    Box, Button, Heading, Table, Tbody, Td, Th, Thead, Tr, Badge, useToast,
    IconButton, Menu, MenuButton, MenuList, MenuItem, VStack, Spinner, Center,
    Text, HStack, useBreakpointValue, InputGroup, InputLeftElement, Container,
    Select, ButtonGroup, Flex, Input
} from '@chakra-ui/react';

import { useEffect, useState, useCallback } from 'react';
import {
    RiMore2Fill, RiSearchLine, RiEyeLine, RiArrowLeftSLine, RiArrowRightSLine
} from 'react-icons/ri';
import { WarningIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';

// --- INTERFACES ---
interface Ticket {
    id: number;
    status: string;
    number?: string;
    equipment_details?: { name: string };
    equipment_name?: string;
    completed_by_name?: string;
    planned_at?: string;
    is_late?: boolean;
    created_at?: string;
}

interface BackendUser {
    id: string | number;
    first_name: string;
    last_name: string;
    display_name?: string;
    username?: string;
}

interface BackendEquipment {
    id: string | number;
    name: string;
    code?: string; // Optionnel si tu as un code équipement
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'gray', planned: 'purple', in_progress: 'blue', completed: 'green', closed: 'orange',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Qualifié', planned: 'Planifié', in_progress: 'En cours', completed: 'Terminé', closed: 'Clôturé',
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

export default function TicketManager({ onTicketClick }: { onTicketClick?: (id: number) => void }) {
    const navigate = useNavigate();
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, md: false });

    // --- ÉTATS DES DONNÉES RÉELLES ---
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [technicians, setTechnicians] = useState<BackendUser[]>([]);
    const [equipments, setEquipments] = useState<BackendEquipment[]>([]);

    // --- ÉTATS DES FILTRES ---
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [techFilter, setTechFilter] = useState('');
    const [equipFilter, setEquipFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- ÉTATS PAGINATION ---
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [prevCursor, setPrevCursor] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState(50);

    // Debounce pour la recherche textuelle
    useEffect(() => {
        const handler = setTimeout(() => setSearchTerm(searchInput), 500);
        return () => clearTimeout(handler);
    }, [searchInput]);

    // --- 🔄 CHARGEMENT DES FILTRES DYNAMIQUES ---
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                // 1. Récupération des techniciens
                const usersRes = await api.get('/api/v1/customers/users/', { params: { page_size: 200 } });
                const fetchedUsers = Array.isArray(usersRes.data)
                    ? usersRes.data
                    : (usersRes.data?.results || usersRes.data?.data?.results || []);
                setTechnicians(fetchedUsers);

                // 2. Récupération des équipements (Gestion robuste si tableau direct ou paginé)
                const equipRes = await api.get('/api/v1/equipments/', { params: { page_size: 200 } });
                const fetchedEquips = Array.isArray(equipRes.data)
                    ? equipRes.data
                    : (equipRes.data?.results || equipRes.data?.data?.results || []);
                setEquipments(fetchedEquips);

            } catch (err) {
                console.error("❌ Impossible de charger les options des filtres", err);
            }
        };

        fetchFilterData();
    }, []);

    // --- REQUÊTE API INTERVENTIONS ---
    const loadTickets = useCallback(async (cursorUrl?: string | null) => {
        setLoading(true);
        try {
            let url = cursorUrl || '/api/v1/ticket-analytics/';
            const config: any = {};

            if (!cursorUrl) {
                config.params = {
                    page_size: pageSize,
                    search: searchTerm || undefined,
                    status: statusFilter || undefined,
                    technician: techFilter || undefined,
                    equipment: equipFilter || undefined,
                    start_date: startDate ? `${startDate}T00:00:00` : undefined,
                    end_date: endDate ? `${endDate}T23:59:59` : undefined,
                };
            }

            const response = await api.get(url, config);
            const apiData = response.data.data || response.data;

            // Gestion de la liste des tickets
            setTickets(apiData.results || (Array.isArray(apiData) ? apiData : []));
            setNextCursor(apiData.pagination?.next || apiData.next || null);
            setPrevCursor(apiData.pagination?.previous || apiData.previous || null);
        } catch (err: any) {
            toast({
                title: 'Erreur',
                description: err?.response?.data?.detail || 'Impossible de charger les interventions.',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, techFilter, equipFilter, startDate, endDate, pageSize, toast]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleViewTicket = (id: number) => {
        if (onTicketClick) {
            onTicketClick(id);
        } else {
            navigate(`/tickets/${id}`);
        }
    };

    return (
        <Container maxW="full" py={0} px={0} h="full">
            <Flex direction="column" h="calc(100vh - 150px)">

                {/* HEADER & FILTRES FIXES */}
                <Box mb={6}>
                    <Box mb={4}>
                        <Heading size="lg" color="gray.800">Cockpit d'Analyses</Heading>
                        <Text fontSize="sm" color="gray.500" mt={1}>Filtres croisés avancés et suivi des interventions</Text>
                    </Box>

                    {/* Grille de filtrage */}
                    <Flex direction={{ base: 'column', lg: 'row' }} gap={3} flexWrap="wrap">
                        <InputGroup maxW={{ base: 'full', lg: '250px' }}>
                            <InputLeftElement pointerEvents="none"><RiSearchLine color="gray.400" size={18} /></InputLeftElement>
                            <Input
                                placeholder="Rechercher un numéro..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                bg="white"
                                borderRadius="lg"
                            />
                        </InputGroup>

                        <Select placeholder="Tous les statuts" maxW={{ base: 'full', lg: '180px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} bg="white" borderRadius="lg">
                            {Object.keys(STATUS_LABELS).map(key => <option key={key} value={key}>{STATUS_LABELS[key]}</option>)}
                        </Select>

                        {/* Rendu dynamique basé sur les vrais utilisateurs */}
                        <Select placeholder="Tous les techniciens" maxW={{ base: 'full', lg: '200px' }} value={techFilter} onChange={(e) => setTechFilter(e.target.value)} bg="white" borderRadius="lg">
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.display_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.username}
                                </option>
                            ))}
                        </Select>

                        {/* Rendu dynamique basé sur les vrais équipements */}
                        <Select placeholder="Tous les équipements" maxW={{ base: 'full', lg: '200px' }} value={equipFilter} onChange={(e) => setEquipFilter(e.target.value)} bg="white" borderRadius="lg">
                            {equipments.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.name || `Équipement #${e.id}`}
                                </option>
                            ))}
                        </Select>

                        <HStack maxW={{ base: 'full', lg: '320px' }} w="full" spacing={2}>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} bg="white" borderRadius="lg" size="md" />
                            <Text fontSize="xs" color="gray.400">au</Text>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} bg="white" borderRadius="lg" size="md" />
                        </HStack>
                    </Flex>
                </Box>

                {/* ZONE SCROLLABLE DE TES TABLEAUX */}
                <Box flex="1" overflowY="auto" borderRadius="lg" border="1px solid" borderColor="gray.200" bg="white">
                    {loading ? (
                        <Center p={10}><Spinner color="purple.500" /></Center>
                    ) : (
                        <>
                            {!isMobile ? (
                                <Table variant="simple" size="md">
                                    <Thead bg="gray.50" position="sticky" top={0} zIndex={1} shadow="sm">
                                        <Tr>
                                            <Th py={4} px={6}>Numéro</Th>
                                            <Th px={6}>Équipement</Th>
                                            <Th px={6}>Technicien</Th>
                                            <Th px={6}>Statut</Th>
                                            <Th px={6}>Créé le</Th>
                                            <Th px={6}>Planifié le</Th>
                                            <Th px={6} textAlign="center">Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {tickets.length === 0 ? (
                                            <Tr><Td colSpan={7} textAlign="center" py={10} color="gray.400">Aucune intervention trouvée</Td></Tr>
                                        ) : (
                                            tickets.map((ticket) => (
                                                <Tr key={ticket.id} borderBottom="1px solid" borderColor="gray.200" _hover={{ bg: 'gray.50' }}>
                                                    <Td py={4} px={6} fontWeight="bold" color="purple.700">#{ticket.number || ticket.id}</Td>
                                                    <Td px={6} fontWeight="500">{ticket.equipment_name || ticket.equipment_details?.name || 'N/A'}</Td>
                                                    <Td px={6} fontSize="sm" color="gray.600">{ticket.completed_by_name || '-'}</Td>
                                                    <Td px={6}><Badge colorScheme={STATUS_COLORS[ticket.status]}>{STATUS_LABELS[ticket.status] || ticket.status}</Badge></Td>
                                                    <Td px={6} fontSize="xs" color="gray.500">{formatDate(ticket.created_at)}</Td>
                                                    <Td px={6} fontSize="xs">
                                                        <HStack spacing={1}>
                                                            {ticket.is_late && <WarningIcon color="red.500" w={3} h={3} />}
                                                            <Text fontWeight={ticket.is_late ? "bold" : "normal"} color={ticket.is_late ? "red.500" : "gray.600"}>
                                                                {formatDate(ticket.planned_at)}
                                                            </Text>
                                                        </HStack>
                                                    </Td>
                                                    <Td px={6} textAlign="center">
                                                        <Menu isLazy>
                                                            <MenuButton as={IconButton} icon={<RiMore2Fill />} variant="ghost" size="sm" />
                                                            <MenuList boxShadow="0 4px 12px rgba(0,0,0,0.1)">
                                                                <MenuItem icon={<RiEyeLine />} onClick={() => handleViewTicket(ticket.id)}>Détails</MenuItem>
                                                            </MenuList>
                                                        </Menu>
                                                    </Td>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                            ) : (
                                <VStack spacing={3} p={4} align="stretch">
                                    {tickets.length === 0 ? (
                                        <Text textAlign="center" color="gray.400" py={4}>Aucune intervention trouvée</Text>
                                    ) : (
                                        tickets.map(ticket => (
                                            <Box key={ticket.id} p={4} bg="white" w="full" borderRadius="lg" border="1px solid" borderColor="gray.200">
                                                <HStack justify="space-between" mb={2}>
                                                    <Text fontWeight="700" color="purple.700">#{ticket.number || ticket.id}</Text>
                                                    <Badge colorScheme={STATUS_COLORS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
                                                </HStack>
                                                <Text fontWeight="600" fontSize="sm" mb={1}>{ticket.equipment_name || ticket.equipment_details?.name || 'N/A'}</Text>
                                                <Text fontSize="xs" color="gray.500" mb={3}>Tech: {ticket.completed_by_name || '-'}</Text>
                                                <HStack justify="space-between" align="center">
                                                    <HStack spacing={1}>
                                                        {ticket.is_late && <WarningIcon color="red.500" w={3} h={3} />}
                                                        <Text fontSize="xs" color={ticket.is_late ? "red.500" : "gray.500"}>
                                                            {formatDate(ticket.planned_at)}
                                                        </Text>
                                                    </HStack>
                                                    <IconButton size="sm" icon={<RiEyeLine />} onClick={() => handleViewTicket(ticket.id)} variant="ghost" aria-label="Voir" />
                                                </HStack>
                                            </Box>
                                        ))
                                    )}
                                </VStack>
                            )}
                        </>
                    )}
                </Box>

                {/* PAGINATION FIXE COLLÉE EN BAS */}
                <HStack justify="space-between" mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
                    <Select w="100px" size="sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} bg="white">
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </Select>
                    <ButtonGroup isAttached size="sm" variant="outline">
                        <Button isDisabled={!prevCursor} onClick={() => loadTickets(prevCursor)} leftIcon={<RiArrowLeftSLine />}>Précédent</Button>
                        <Button isDisabled={!nextCursor} onClick={() => loadTickets(nextCursor)} rightIcon={<RiArrowRightSLine />}>Suivant</Button>
                    </ButtonGroup>
                </HStack>
            </Flex>
        </Container>
    );
}