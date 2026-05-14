import {
    Box, Text, Flex, SimpleGrid, Badge, Spinner,
    Center, HStack, useToast, Icon, Input, Heading, Container,
    Table, Thead, Tbody, Tr, Th, Td, Select, Button, ButtonGroup
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { FiClock, FiTool, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import api from '../../api/apiClient';

interface DashboardHomeProps {
    user: any;
}

// Interface alignée sur ton nouveau Backend
interface DashboardData {
    results: Ticket[];
    stats: {
        total: number;
        by_status: {
            draft: number;
            planned: number;
            in_progress: number;
            completed: number;
            closed: number;
        };
        total_working_hours: number;
    };
    pagination?: {
        next: string | null;
        previous: string | null;
    };
    period: {
        start: string;
        end: string;
    };
}

interface Ticket {
    id: string;
    number: string;
    status: string;
    equipment_name?: string; // Simplifié selon ton serializer
    intervention_type_name?: string;
    is_late: boolean;
    planned_at: string;
}

export default function DashboardHome({ user }: DashboardHomeProps) {
    const today = new Date().toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState({ start: today, end: today });
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [prevCursor, setPrevCursor] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState(50);

    const toast = useToast();

    const fetchDashboard = useCallback(async (cursorUrl?: string | null) => {
        try {
            setLoading(true);
            const res = await api.get(cursorUrl || '/api/v1/dashboard/stats/', {
                params: !cursorUrl ? {
                    start_date: dateRange.start,
                    end_date: dateRange.end,
                    page_size: pageSize
                } : {}
            });
            setData(res.data);
            setNextCursor(res.data.pagination?.next || null);
            setPrevCursor(res.data.pagination?.previous || null);
        } catch (error) {
            toast({
                title: 'Erreur Matx',
                description: 'Impossible de récupérer les statistiques.',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    }, [dateRange, pageSize, toast]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return (
        <Container maxW="full" py={0} px={0} h="full">
            <Flex direction="column" h="calc(100vh - 150px)">
                {/* HEADER FIXE */}
                <Box mb={6}>
                    <HStack justify="space-between" align="flex-start" mb={4}>
                        <Box>
                            <Heading size="lg" color="gray.800">Dashboard</Heading>
                            <Text fontSize="sm" color="gray.500" mt={1}>Bienvenue, {user?.display_name || user?.username || 'Technicien'}</Text>
                        </Box>

                        <HStack bg="white" p={2} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.200">
                            <Icon as={FiCalendar} color="purple.500" ml={2} />
                            <Input
                                type="date"
                                variant="unstyled"
                                size="sm"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <Text fontSize="xs" fontWeight="bold">AU</Text>
                            <Input
                                type="date"
                                variant="unstyled"
                                size="sm"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </HStack>
                    </HStack>

                    {/* KPI CARDS */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                        <StatCard
                            title="Total Tickets"
                            count={data?.stats.total || 0}
                            icon={FiTool}
                            color="purple.500"
                        />
                        <StatCard
                            title="En Cours"
                            count={data?.stats.by_status.in_progress || 0}
                            icon={FiClock}
                            color="orange.400"
                        />
                        <StatCard
                            title="Heures Travail"
                            count={`${data?.stats.total_working_hours || 0}h`}
                            icon={FiCalendar}
                            color="blue.400"
                        />
                        <StatCard
                            title="Complétés"
                            count={data?.stats.by_status.completed || 0}
                            icon={FiAlertCircle}
                            color="green.400"
                        />
                    </SimpleGrid>
                </Box>

                {/* ZONE SCROLLABLE - TABLEAU DES TICKETS */}
                <Box flex="1" overflowY="auto" borderRadius="lg" border="1px solid" borderColor="gray.200" bg="white">
                    {loading ? (
                        <Center p={10}><Spinner color="purple.500" /></Center>
                    ) : data?.results && data.results.length > 0 ? (
                        <Table variant="simple" size="sm">
                            <Thead bg="gray.50" position="sticky" top={0} zIndex={1} shadow="sm">
                                <Tr>
                                    <Th py={3} px={4}>N°</Th>
                                    <Th px={4}>Équipement</Th>
                                    <Th px={4}>Type</Th>
                                    <Th px={4}>Statut</Th>
                                    <Th px={4}>Date</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.results.map((ticket) => (
                                    <Tr key={ticket.id} borderBottom="1px solid" borderColor="gray.200" _hover={{ bg: 'gray.50' }}>
                                        <Td py={3} px={4} fontWeight="bold" fontSize="sm" bg="gray.50" borderRadius="md">{ticket.number}</Td>
                                        <Td px={4} fontSize="sm">{ticket.equipment_name || 'N/A'}</Td>
                                        <Td px={4} fontSize="sm" color="gray.600">{ticket.intervention_type_name || '-'}</Td>
                                        <Td px={4}>
                                            <HStack spacing={2}>
                                                {ticket.is_late && <Badge colorScheme="red" fontSize="xs">Retard</Badge>}
                                                <Badge colorScheme={getStatusColor(ticket.status)} fontSize="xs">{ticket.status}</Badge>
                                            </HStack>
                                        </Td>
                                        <Td px={4} fontSize="sm" color="gray.600">{formatDate(ticket.planned_at)}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    ) : (
                        <Center py={20} flexDirection="column">
                            <Icon as={FiTool} fontSize="4xl" color="gray.200" mb={3} />
                            <Text color="gray.400">Aucune activité enregistrée sur cette période.</Text>
                        </Center>
                    )}
                </Box>

                {/* PAGINATION FIXE */}
                <HStack justify="space-between" mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
                    <Select w="100px" size="sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} bg="white">
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </Select>
                    <ButtonGroup isAttached size="sm" variant="outline">
                        <Button isDisabled={!prevCursor} onClick={() => fetchDashboard(prevCursor)} leftIcon={<RiArrowLeftSLine />}>Précédent</Button>
                        <Button isDisabled={!nextCursor} onClick={() => fetchDashboard(nextCursor)} rightIcon={<RiArrowRightSLine />}>Suivant</Button>
                    </ButtonGroup>
                </HStack>
            </Flex>
        </Container>
    );
}

// Utilitaires
function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        planned: 'blue',
        in_progress: 'orange',
        completed: 'green',
        closed: 'purple',
        draft: 'gray'
    };
    return colors[status] || 'gray';
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('fr-FR', { year: '2-digit', month: '2-digit', day: '2-digit' });
    } catch {
        return dateStr;
    }
}

// COMPOSANT STAT CARD OPTIMISÉ
function StatCard({ title, count, icon, color }: any) {
    return (
        <Box bg="white" p={5} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
            <Flex align="center">
                <Center bg={`${color}10`} p={3} borderRadius="xl" mr={4}>
                    <Icon as={icon} color={color} fontSize="xl" />
                </Center>
                <Box>
                    <Text color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">{title}</Text>
                    <Text fontSize="2xl" fontWeight="black">{count}</Text>
                </Box>
            </Flex>
        </Box>
    );
}