import {
    Box,
    Heading,
    useToast,
    VStack,
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

    // ================= SEARCH DEBOUNCE =================

    useEffect(() => {

        const handler = setTimeout(() => {
            setSearchTerm(searchInput);
        }, 500);

        return () => clearTimeout(handler);

    }, [searchInput]);

    // ================= LOAD FILTERS =================

    useEffect(() => {

        const fetchFilters = async () => {

            try {

                // ===== USERS =====

                const usersRes = await api.get(
                    '/api/v1/customers/users/',
                    {
                        params: {
                            page_size: 200,
                        },
                    }
                );

                const fetchedUsers = Array.isArray(usersRes.data)
                    ? usersRes.data
                    : (
                        usersRes.data?.results ||
                        usersRes.data?.data?.results ||
                        []
                    );

                setTechnicians(fetchedUsers);

                // ===== EQUIPMENTS =====

                const equipRes = await api.get(
                    '/api/v1/equipments/',
                    {
                        params: {
                            page_size: 200,
                        },
                    }
                );

                const fetchedEquips = Array.isArray(equipRes.data)
                    ? equipRes.data
                    : (
                        equipRes.data?.results ||
                        equipRes.data?.data?.results ||
                        []
                    );

                setEquipments(fetchedEquips);

            } catch (err) {

                console.error(err);

                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger les filtres.',
                    status: 'error',
                    duration: 3000,
                });

            }
        };

        fetchFilters();

    }, [toast]);

    // ================= ACTIVE PARAMS =================

    const getActiveParams = useCallback(() => {

        let formattedStart: string | undefined = undefined;

        let formattedEnd: string | undefined = undefined;

        if (startDate) {

            const sDate = new Date(`${startDate}T00:00:00`);

            if (!isNaN(sDate.getTime())) {
                formattedStart = sDate.toISOString();
            }
        }

        if (endDate) {

            const eDate = new Date(`${endDate}T23:59:59`);

            if (!isNaN(eDate.getTime())) {
                formattedEnd = eDate.toISOString();
            }
        }

        return {
            page_size: pageSize,

            search: searchTerm || undefined,

            status: statusFilter || undefined,

            completed_by: techFilter || undefined,

            equipment: equipFilter || undefined,

            start_date: formattedStart,

            end_date: formattedEnd,
        };

    }, [
        pageSize,
        searchTerm,
        statusFilter,
        techFilter,
        equipFilter,
        startDate,
        endDate,
    ]);

    // ================= LOAD TICKETS =================

    const loadTickets = useCallback(async (cursorUrl?: string | null) => {

        setLoading(true);

        try {

            let url = cursorUrl || '/api/v1/ticket-analytics/';

            const config: any = {};

            if (!cursorUrl) {
                config.params = getActiveParams();
            }

            const response = await api.get(url, config);

            const apiData = response.data.data || response.data;

            const results = apiData.results || (
                Array.isArray(apiData)
                    ? apiData
                    : []
            );

            setTickets(results);

            setNextCursor(
                apiData.pagination?.next ||
                apiData.next ||
                null
            );

            setPrevCursor(
                apiData.pagination?.previous ||
                apiData.previous ||
                null
            );

        } catch (err: any) {

            console.error(err);

            toast({
                title: 'Erreur',
                description:
                    err?.response?.data?.detail ||
                    'Impossible de charger les interventions.',
                status: 'error',
                duration: 3000,
            });

        } finally {

            setLoading(false);

        }

    }, [getActiveParams, toast]);

    // ================= AUTO LOAD =================

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // ================= EXPORT =================

    const handleExport = async () => {

        setExporting(true);

        try {

            const currentParams = getActiveParams();

            const response = await api.get(
                '/api/v1/ticket-analytics/export/',
                {
                    params: currentParams,
                    responseType: 'blob',
                }
            );

            const blob = new Blob([response.data]);

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');

            link.href = url;

            link.setAttribute(
                'download',
                `export_interventions_${new Date()
                    .toISOString()
                    .slice(0, 10)}.csv`
            );

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

            toast({
                title: 'Export réussi',
                description: 'Le fichier a été téléchargé.',
                status: 'success',
                duration: 3000,
            });

        } catch (err) {

            console.error(err);

            toast({
                title: 'Erreur Export',
                description: 'Impossible de générer le fichier.',
                status: 'error',
                duration: 4000,
            });

        } finally {

            setExporting(false);

        }
    };

    // ================= OPEN TICKET =================
    // MAINTENANT : navigation sur la même page

    const handleOpenTicket = (id: number) => {

        navigate(`/tickets/${id}`);

    };

    // ================= RENDER =================

    return (
        <Container maxW="full" py={0} px={0} h="full">

            <Flex direction="column" h="calc(100vh - 150px)">

                {/* HEADER */}

                <Box mb={6}>

                    <Flex
                        justify="space-between"
                        align="flex-start"
                        mb={4}
                        direction={{ base: 'column', sm: 'row' }}
                        gap={4}
                    >

                        <Box>

                            <Heading size="lg" color="gray.800">
                                Cockpit d'Analyses
                            </Heading>

                            <Text
                                fontSize="sm"
                                color="gray.500"
                                mt={1}
                            >
                                Filtres croisés avancés
                            </Text>

                        </Box>

                        <Button
                            leftIcon={<RiDownload2Line />}
                            colorScheme="purple"
                            borderRadius="lg"
                            isLoading={exporting}
                            loadingText="Génération..."
                            onClick={handleExport}
                            w={{ base: 'full', sm: 'auto' }}
                        >
                            Exporter
                        </Button>

                    </Flex>

                    {/* FILTERS */}

                    <Flex
                        direction={{ base: 'column', lg: 'row' }}
                        gap={3}
                        flexWrap="wrap"
                    >

                        {/* SEARCH */}

                        <InputGroup maxW={{ base: 'full', lg: '250px' }}>

                            <InputLeftElement pointerEvents="none">
                                <RiSearchLine
                                    color="gray.400"
                                    size={18}
                                />
                            </InputLeftElement>

                            <Input
                                placeholder="Rechercher un numéro..."
                                value={searchInput}
                                onChange={(e) =>
                                    setSearchInput(e.target.value)
                                }
                                bg="white"
                                borderRadius="lg"
                            />

                        </InputGroup>

                        {/* STATUS */}

                        <Select
                            placeholder="Tous les statuts"
                            maxW={{ base: 'full', lg: '180px' }}
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            bg="white"
                            borderRadius="lg"
                        >

                            {Object.keys(STATUS_LABELS).map(key => (
                                <option key={key} value={key}>
                                    {STATUS_LABELS[key]}
                                </option>
                            ))}

                        </Select>

                        {/* TECH */}

                        <Select
                            placeholder="Tous les techniciens"
                            maxW={{ base: 'full', lg: '220px' }}
                            value={techFilter}
                            onChange={(e) =>
                                setTechFilter(e.target.value)
                            }
                            bg="white"
                            borderRadius="lg"
                        >

                            {technicians.map(t => (

                                <option key={t.id} value={t.id}>

                                    {
                                        t.display_name ||
                                        `${t.first_name || ''} ${t.last_name || ''}`.trim() ||
                                        t.username
                                    }

                                </option>

                            ))}

                        </Select>

                        {/* EQUIPMENT */}

                        <Select
                            placeholder="Tous les équipements"
                            maxW={{ base: 'full', lg: '240px' }}
                            value={equipFilter}
                            onChange={(e) =>
                                setEquipFilter(e.target.value)
                            }
                            bg="white"
                            borderRadius="lg"
                        >

                            {equipments.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.name}
                                </option>
                            ))}

                        </Select>

                        {/* DATES */}

                        <HStack
                            maxW={{ base: 'full', lg: '320px' }}
                            w="full"
                            spacing={2}
                        >

                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                                bg="white"
                                borderRadius="lg"
                            />

                            <Text
                                fontSize="xs"
                                color="gray.400"
                            >
                                au
                            </Text>

                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(e.target.value)
                                }
                                bg="white"
                                borderRadius="lg"
                            />

                        </HStack>

                    </Flex>

                </Box>

                {/* TABLE COMPONENT */}

                <TicketTable
                    tickets={tickets}
                    loading={loading}
                    onOpenTicket={handleOpenTicket}
                />

                {/* PAGINATION */}

                <HStack
                    justify="space-between"
                    mt={4}
                    pt={4}
                    borderTop="1px solid"
                    borderColor="gray.200"
                >

                    <Select
                        w="100px"
                        size="sm"
                        value={pageSize}
                        onChange={(e) =>
                            setPageSize(Number(e.target.value))
                        }
                        bg="white"
                    >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </Select>

                    <ButtonGroup
                        isAttached
                        size="sm"
                        variant="outline"
                    >

                        <Button
                            isDisabled={!prevCursor}
                            onClick={() =>
                                loadTickets(prevCursor)
                            }
                            leftIcon={<RiArrowLeftSLine />}
                        >
                            Précédent
                        </Button>

                        <Button
                            isDisabled={!nextCursor}
                            onClick={() =>
                                loadTickets(nextCursor)
                            }
                            rightIcon={<RiArrowRightSLine />}
                        >
                            Suivant
                        </Button>

                    </ButtonGroup>

                </HStack>

            </Flex>

        </Container>
    );
}