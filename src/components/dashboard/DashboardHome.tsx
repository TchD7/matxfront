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
    IconButton,
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
    first_name?: string;
    last_name?: string;
    team_code?: string;
    planned: number;
    in_progress: number;
    completed: number;
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
    const [dashboardData, setDashboardData] = useState<any>(null);

    // Notre référentiel complet de techniciens
    const [techRegistry, setTechRegistry] = useState<any[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTech, setSelectedTech] = useState<string | null>(null);

    const toast = useToast();

    // ================= DATE CHANGING =================
    const changeDate = (offset: number) => {
        setDate((current) => {
            const d = new Date(current);
            d.setDate(d.getDate() + offset);
            return d.toISOString().split('T')[0];
        });
    };

    // ================= FETCH STATIC REGISTRY ONCE =================
    useEffect(() => {
        const fetchRegistry = async () => {
            try {
                const res = await api.get('/api/v1/technicians/');
                const raw = res.data?.results || res.data;
                setTechRegistry(Array.isArray(raw) ? raw : []);
            } catch (err) {
                console.error("Impossible de charger le référentiel des techniciens", err);
            }
        };
        fetchRegistry();
    }, []);

    // ================= FETCH DYNAMIC DAILY DATA =================
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Récupération des KPI globaux
            const dashboardRes = await api.get('/api/v1/dashboard/', {
                params: { date }
            });
            setDashboardData(dashboardRes.data);

            // 2. Récupération des tickets du jour
            const ticketRes = await api.get('/api/v1/tickets/', {
                params: { date }
            });
            setTickets(ticketRes.data?.results || ticketRes.data || []);

        } catch (err) {
            toast({
                title: 'Erreur lors du chargement des données',
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

    // ================= DYNAMIC CALCULATIONS =================
    const techniciansWithLiveStats = useMemo(() => {
        return techRegistry.map((tech) => {
            // ID du technicien du registre (ex: "499")
            const registryId = String(tech.id || '').trim();

            // Filtrage ultra-tolérant sur les tickets
            const techTickets = tickets.filter((ticket: any) => {
                // On récupère toutes les manières dont l'ID peut être écrit dans le ticket
                const ticketTechId = String(ticket.technician_id || '').trim();
                const ticketTechField = String(ticket.technician || '').trim();

                // On vérifie aussi par rapport au nom/username au cas où le backend renvoie des chaînes
                const ticketTechName = (ticket.technician_name || '').toLowerCase().trim();
                const techFullName = `${tech.last_name || ''} ${tech.first_name || ''}`.toLowerCase().trim();
                const techUsername = (tech.username || '').toLowerCase().trim();

                return (
                    (ticketTechId !== '' && ticketTechId === registryId) ||
                    (ticketTechField !== '' && ticketTechField === registryId) ||
                    (ticketTechName !== '' && (ticketTechName === techFullName || ticketTechName === techUsername))
                );
            });

            // Calcul des compteurs (tolérant à la casse)
            const planned = techTickets.filter(t => {
                const status = (t.status || '').toLowerCase();
                return status === 'planned' || status === 'planifié' || status === 'open';
            }).length;

            const in_progress = techTickets.filter(t => {
                const status = (t.status || '').toLowerCase();
                return status === 'in_progress' || status === 'en_cours';
            }).length;

            const completed = techTickets.filter(t => {
                const status = (t.status || '').toLowerCase();
                return status === 'completed' || status === 'terminé';
            }).length;

            return {
                ...tech,
                planned,
                in_progress,
                completed
            };
        });
    }, [techRegistry, tickets]);

    // ================= FORMAT LABELS =================
    const getTechLabel = (tech: any) => {
        const fullName = `${tech.last_name || ''} ${tech.first_name || ''}`.trim();
        return tech.team_code
            ? `${tech.team_code}-${fullName}`
            : fullName;
    };

    // ================= FILTER & SORT TECH LIST =================
    const filteredTechs = useMemo(() => {
        return techniciansWithLiveStats
            .filter((t: any) => {
                const label = getTechLabel(t).toLowerCase();
                return label.includes(searchQuery.toLowerCase());
            })
            // Optionnel : Met en haut de la liste les techniciens qui ont du travail aujourd'hui
            .sort((a, b) => (b.planned + b.in_progress) - (a.planned + a.in_progress));
    }, [techniciansWithLiveStats, searchQuery]);

    const totalDraftTickets = tickets.filter(t => t.status?.toLowerCase() === 'draft').length;

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
                <Kpi title="Planifié" value={dashboardData?.stats?.planned ?? 0} />
                <Kpi title="En cours" value={dashboardData?.stats?.in_progress ?? 0} />
                <Kpi title="Terminé" value={dashboardData?.stats?.completed ?? 0} />
                <Kpi title="Clôturé" value={dashboardData?.stats?.closed ?? 0} />
            </SimpleGrid>

            {/* MAIN CONTENT */}
            <Flex gap={6} direction={{ base: "column", xl: "row" }}>

                {/* LEFT SIDE: TECHNICIANS LIST */}
                <Box
                    flex="1"
                    bg="white"
                    p={4}
                    borderRadius="lg"
                    border="1px solid #eee"
                    display="flex"
                    flexDirection="column"
                    minW="320px"
                >
                    <Text fontWeight="bold" mb={3}>
                        Techniciens
                    </Text>

                    <Input
                        placeholder="Rechercher (nom ou code équipe)"
                        size="sm"
                        mb={4}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {loading && techRegistry.length === 0 ? (
                        <Center py={10}>
                            <Spinner color="purple.500" />
                        </Center>
                    ) : (
                        <Box overflowY="auto" flex="1" maxH="600px">
                            {filteredTechs.map((t: Technician) => {
                                const techId = String(t.id);
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
                                            <Text fontWeight="medium" fontSize="sm">
                                                {getTechLabel(t)}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500" mt={0.5}>
                                                {t.planned} planifié • {t.in_progress} en cours
                                            </Text>
                                        </Box>

                                        <HStack spacing={1}>
                                            <Badge colorScheme="purple" variant={t.planned > 0 ? "solid" : "subtle"}>
                                                {t.planned}
                                            </Badge>
                                            <Badge colorScheme="blue" variant={t.in_progress > 0 ? "solid" : "subtle"}>
                                                {t.in_progress}
                                            </Badge>
                                            <Badge colorScheme="green" variant={t.completed > 0 ? "solid" : "subtle"}>
                                                {t.completed}
                                            </Badge>
                                        </HStack>
                                    </Flex>
                                );
                            })}
                            {filteredTechs.length === 0 && (
                                <Center py={6}>
                                    <Text fontSize="xs" color="gray.400" fontStyle="italic">
                                        Aucun technicien trouvé.
                                    </Text>
                                </Center>
                            )}
                        </Box>
                    )}
                </Box>

                {/* RIGHT SIDE: TIMELINE */}
                <Box
                    flex="3"
                    bg="white"
                    p={4}
                    borderRadius="lg"
                    border="1px solid #eee"
                    display={{ base: 'none', xl: 'flex' }}
                    flexDirection="column"
                    maxW={{ xl: "calc(100vw - 420px)", "2xl": "calc(100vw - 460px)" }}
                    overflow="hidden"
                >
                    <Text fontWeight="bold" mb={4}>
                        Planning Journalier
                    </Text>

                    <Box overflowX="auto" flex="1" pb={2}>
                        <Box minW="800px">
                            <InteractiveTimeline
                                date={date}
                                technicianId={selectedTech}
                                tickets={tickets}
                            />
                        </Box>
                    </Box>
                </Box>

            </Flex>
        </Container>
    );
}