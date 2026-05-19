import {
    Box,
    Text,
    Flex,
    SimpleGrid,
    Spinner,
    Center,
    HStack,
    useToast,
    Input,
    Heading,
    Container,
    Badge,
    IconButton, // 👈 Ajouté ici
} from '@chakra-ui/react';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import api from '../../api/apiClient';
import InteractiveTimeline from './InteractiveTimeline';

// ================= TYPES =================
interface Props {
    user: any;
}

interface Technician {
    id: number | string;
    technician_id?: number | string;
    technician_name?: string;
    username?: string;
    team_code?: string;
    planned: number;
    in_progress: number;
    completed: number;
    closed: number;
    total: number;
}

interface Ticket {
    id: string;
    equipment_name: string;
    technician_id?: string | number;
    technician_name: string;
    status?: string;
    planned_at?: string;
    started_at?: string;
    ended_at?: string;
}

interface KpiProps {
    title: string;
    value: number;
}

// ================= SUB-COMPONENT =================
function Kpi({ title, value }: KpiProps) {
    return (
        <Box bg="white" p={4} borderRadius="lg" border="1px solid #eee">
            <Text fontSize="sm" color="gray.500">{title}</Text>
            <Text fontSize="2xl" fontWeight="bold">{value}</Text>
        </Box>
    );
}

// ================= MAIN COMPONENT =================
export default function DashboardHome({ user }: Props) {

    const today = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(today);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    const [searchTech, setSearchTech] = useState('');
    const [selectedTech, setSelectedTech] = useState<string | null>(null);

    const toast = useToast();

    // ================= DATE =================
    const changeDate = (offset: number) => {
        setDate((current) => {
            const d = new Date(current);
            d.setDate(d.getDate() + offset);
            return d.toISOString().split('T')[0];
        });
    };

    // ================= FETCH =================
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            const res = await api.get('/api/v1/dashboard/', {
                params: { date }
            });

            setData(res.data);

            const ticketRes = await api.get('/api/v1/tickets/', {
                params: { date }
            });

            setTickets(ticketRes.data.results || []);

        } catch (err) {
            toast({
                title: 'Erreur chargement dashboard',
                status: 'error',
                duration: 3000
            });
        } finally {
            setLoading(false);
        }
    }, [date, toast]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // ================= FORMAT TECH =================
    const formatTech = (t: Technician) => {
        const name = t.technician_name || t.username || '';
        const team = t.team_code || '';
        return team ? `${team}-${name}` : name;
    };

    // ================= FILTER TECH =================
    const filteredTechs = useMemo(() => {
        return (data?.technicians || []).filter((t: Technician) => {
            const search = searchTech.toLowerCase();

            return (
                (t.technician_name || '').toLowerCase().includes(search) ||
                (t.username || '').toLowerCase().includes(search) ||
                (t.team_code || '').toLowerCase().includes(search)
            );
        });
    }, [data, searchTech]);

    // ================= FILTER TICKETS =================
    const timelineTickets = useMemo(() => {
        if (!selectedTech) return tickets;

        return tickets.filter((ticket) => {
            if (!ticket.technician_id) return false;
            return String(ticket.technician_id) === String(selectedTech);
        });
    }, [tickets, selectedTech]);

    // ================= KPI =================
    const totalDraftTickets = tickets.filter(t => t.status === 'draft').length;

    return (
        <Container maxW="full" py={4} minH="100vh">

            {/* HEADER */}
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Heading size="lg">Dashboard Maintenance</Heading>
                    <Text fontSize="sm" color="gray.500">
                        Bienvenue {user?.display_name || user?.username}
                    </Text>
                </Box>

                <HStack spacing={2}>
                    <IconButton
                        aria-label="prev"
                        icon={<FiChevronLeft />}
                        onClick={() => changeDate(-1)}
                    />
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        w="200px"
                    />
                    <IconButton
                        aria-label="next"
                        icon={<FiChevronRight />}
                        onClick={() => changeDate(1)}
                    />
                </HStack>
            </Flex>

            {/* KPI */}
            <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={6}>
                <Kpi title="Qualifié" value={totalDraftTickets} />
                <Kpi title="Planifié" value={data?.stats?.planned ?? 0} />
                <Kpi title="En cours" value={data?.stats?.in_progress ?? 0} />
                <Kpi title="Terminé" value={data?.stats?.completed ?? 0} />
                <Kpi title="Clôturé" value={data?.stats?.closed ?? 0} />
            </SimpleGrid>

            {/* MAIN */}
            <Flex gap={6} direction={{ base: "column", xl: "row" }}>

                {/* LEFT TECHNICIENS */}
                <Box
                    flex="1"
                    bg="white"
                    p={4}
                    borderRadius="lg"
                    border="1px solid #eee"
                    display="flex"
                    flexDirection="column"
                >
                    <Text fontWeight="bold" mb={3}>
                        Techniciens
                    </Text>

                    <Input
                        placeholder="Rechercher (nom, username, code)"
                        size="sm"
                        mb={4}
                        value={searchTech}
                        onChange={(e) => setSearchTech(e.target.value)}
                    />

                    {loading ? (
                        <Center py={10}>
                            <Spinner />
                        </Center>
                    ) : (
                        <Box overflowY="auto" flex="1">

                            {filteredTechs.map((t: Technician) => {

                                const techId = String(t.technician_id || t.id);
                                const isSelected = selectedTech === techId;

                                return (
                                    <Flex
                                        key={techId}
                                        p={3}
                                        borderBottom="1px solid #eee"
                                        cursor="pointer"
                                        bg={isSelected ? 'purple.50' : 'transparent'}
                                        _hover={{ bg: 'gray.50' }}
                                        justify="space-between"
                                        align="center"
                                        onClick={() =>
                                            setSelectedTech(
                                                isSelected ? null : techId
                                            )
                                        }
                                    >
                                        <Box>
                                            <Text fontWeight="medium">
                                                {formatTech(t)}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                {t.planned} planifié • {t.in_progress} en cours
                                            </Text>
                                        </Box>

                                        <HStack spacing={2}>
                                            <Badge colorScheme="purple">
                                                {t.planned}
                                            </Badge>
                                            <Badge colorScheme="blue">
                                                {t.in_progress}
                                            </Badge>
                                            <Badge colorScheme="green">
                                                {t.completed}
                                            </Badge>
                                        </HStack>
                                    </Flex>
                                );
                            })}

                        </Box>
                    )}
                </Box>

                {/* RIGHT TIMELINE */}
                <Box
                    flex="3"
                    bg="white"
                    p={4}
                    borderRadius="lg"
                    border="1px solid #eee"
                    display={{ base: 'none', xl: 'flex' }}
                    flexDirection="column"
                >
                    <Text fontWeight="bold" mb={4}>
                        Planning Journalier
                    </Text>

                    <InteractiveTimeline
                        date={date}
                        technicianId={selectedTech}
                        tickets={timelineTickets}
                    />
                </Box>

            </Flex>
        </Container>
    );
}