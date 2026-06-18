import {
    Box,
    Heading,
    useToast,
    Text,
    HStack,
    InputGroup,
    InputLeftElement,
    Container,
    Select,
    ButtonGroup,
    Button,
    Flex,
    Input,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import {
    RiSearchLine,
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiDownload2Line,
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

import api from '../../api/apiClient';
import TicketTable from './TicketTable';
import { handleExportTickets } from '../common/ExportButton';
import type { Ticket } from './types';

// ================= TYPES =================

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
    code?: string;
}

// ================= STATUS =================

const STATUS_LABELS: Record<string, string> = {
    draft: 'Qualifié',
    planned: 'Planifié',
    in_progress: 'En cours',
    completed: 'Terminé',
    closed: 'Clôturé',
};

// ================= COMPONENT =================

export default function TicketManager() {
    const toast = useToast();
    const navigate = useNavigate();

    // ================= STATES =================

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [technicians, setTechnicians] = useState<BackendUser[]>([]);
    const [equipments, setEquipments] = useState<BackendEquipment[]>([]);

    // ================= FILTERS =================

    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [techFilter, setTechFilter] = useState('');
    const [equipFilter, setEquipFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // ================= PAGINATION =================

    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [prevCursor, setPrevCursor] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState(50);

    // ================= LOGIC =================

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchTerm(searchInput);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [usersRes, equipRes] = await Promise.all([
                    api.get('/api/v1/customers/users/', { params: { page_size: 200 } }),
                    api.get('/api/v1/equipments/', { params: { page_size: 200 } })
                ]);

                setTechnicians(usersRes.data?.results || usersRes.data || []);
                setEquipments(equipRes.data?.results || equipRes.data || []);
            } catch (err) {
                console.error(err);
                toast({ title: 'Erreur', description: 'Impossible de charger les filtres.', status: 'error', duration: 3000 });
            }
        };
        fetchFilters();
    }, [toast]);

    const getActiveParams = useCallback(() => {
        const params: any = { page_size: pageSize };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter) params.status = statusFilter;
        if (techFilter) params.completed_by = techFilter;
        if (equipFilter) params.equipment = equipFilter;
        if (startDate) params.start_date = new Date(`${startDate}T00:00:00`).toISOString();
        if (endDate) params.end_date = new Date(`${endDate}T23:59:59`).toISOString();
        return params;
    }, [pageSize, searchTerm, statusFilter, techFilter, equipFilter, startDate, endDate]);

    const loadTickets = useCallback(async (cursorUrl?: string | null) => {
        setLoading(true);
        try {
            const url = cursorUrl || '/api/v1/ticket-analytics/';
            const config = cursorUrl ? {} : { params: getActiveParams() };

            const response = await api.get(url, config);
            const apiData = response.data.data || response.data;

            setTickets(apiData.results || (Array.isArray(apiData) ? apiData : []));
            setNextCursor(apiData.pagination?.next || apiData.next || null);
            setPrevCursor(apiData.pagination?.previous || apiData.previous || null);
        } catch (err: any) {
            console.error(err);
            toast({
                title: 'Erreur',
                description: err?.response?.data?.detail || 'Impossible de charger les interventions.',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    }, [getActiveParams, toast]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // ================= RENDER =================

    return (
        <Container maxW="full" py={0} px={0} h="full">
            <Flex direction="column" h="calc(100vh - 150px)">
                <Box mb={6}>
                    <Flex justify="space-between" align="flex-start" mb={4} direction={{ base: 'column', sm: 'row' }} gap={4}>
                        <Box>
                            <Heading size="lg" color="gray.800">Cockpit d'Analyses</Heading>
                            <Text fontSize="sm" color="gray.500" mt={1}>Filtres croisés avancés</Text>
                        </Box>
                        <Button
                            leftIcon={<RiDownload2Line />}
                            colorScheme="purple"
                            borderRadius="lg"
                            isLoading={exporting}
                            loadingText="Génération..."
                            onClick={() => handleExportTickets(getActiveParams(), setExporting, toast)}
                        >
                            Exporter
                        </Button>
                    </Flex>

                    <Flex direction={{ base: 'column', lg: 'row' }} gap={3} flexWrap="wrap">
                        <InputGroup maxW={{ base: 'full', lg: '250px' }}>
                            <InputLeftElement pointerEvents="none"><RiSearchLine color="gray.400" size={18} /></InputLeftElement>
                            <Input placeholder="Rechercher..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} bg="white" borderRadius="lg" />
                        </InputGroup>

                        <Select placeholder="Tous les statuts" maxW={{ base: 'full', lg: '180px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} bg="white" borderRadius="lg">
                            {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </Select>

                        <Select placeholder="Tous les techniciens" maxW={{ base: 'full', lg: '220px' }} value={techFilter} onChange={(e) => setTechFilter(e.target.value)} bg="white" borderRadius="lg">
                            {technicians.map(t => <option key={t.id} value={t.id}>{t.display_name || `${t.first_name} ${t.last_name}`}</option>)}
                        </Select>

                        <Select placeholder="Tous les équipements" maxW={{ base: 'full', lg: '240px' }} value={equipFilter} onChange={(e) => setEquipFilter(e.target.value)} bg="white" borderRadius="lg">
                            {equipments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </Select>

                        <HStack maxW={{ base: 'full', lg: '320px' }} w="full" spacing={2}>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} bg="white" borderRadius="lg" />
                            <Text fontSize="xs" color="gray.400">au</Text>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} bg="white" borderRadius="lg" />
                        </HStack>
                    </Flex>
                </Box>

                <TicketTable tickets={tickets} loading={loading} onOpenTicket={(id) => navigate(`/dashboard/tickets/${id}`)} />

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