import {
    Box,
    VStack,
    HStack,
    Text,
    Spinner,
    Center,
    Badge,
    Flex,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/apiClient';

// ==========================================
// 1. TYPES & INTERFACES TYPESCRIPT
// ==========================================
export interface LogDetails {
    planned_at?: string;
    technician_name?: string;
    duration?: number;
    reason?: string;
    work_minutes?: number;
    pause_minutes?: number;
    status?: string;
    start_time?: string;
    end_time?: string;
    duration_seconds?: number;
    [key: string]: any;
}

export interface ActivityLog {
    id: string | number;
    action: string;
    old_data?: LogDetails;
    new_data?: LogDetails;
    performed_by_name?: string;
    created_at: string;
    source: 'ticket' | 'downtime';
}

export interface Ticket {
    id: string | number;
    equipment_id?: string | number;
    logs?: any[];
    downtime_logs?: any[];
}

// ==========================================
// 2. HELPERS DE FORMATEURS
// ==========================================
const formatTableDateTime = (dateIsoString: string): string => {
    if (!dateIsoString) return '';
    const dateObj = new Date(dateIsoString);
    if (isNaN(dateObj.getTime())) return dateIsoString;

    const dateStr = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} - ${timeStr}`;
};

const formatFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
        planned_at: 'Date planifiée',
        technician_name: 'Technicien',
        duration: 'Durée (min)',
        reason: 'Raison / Motif',
        status: 'Statut',
        quantity: 'Quantité',
        work_minutes: 'Temps travaillé',
        pause_minutes: 'Pause',
        start_time: 'Début de l\'arrêt',
        end_time: 'Fin de l\'arrêt',
        duration_seconds: 'Durée de l\'arrêt'
    };
    return labels[key] || key;
};

const formatFieldValue = (key: string, value: any): string => {
    if (value === null || value === undefined || value === '') return 'Aucun';

    if ((key === 'planned_at' || key === 'start_time' || key === 'end_time') && typeof value === 'string') {
        const dateObj = new Date(value);
        return isNaN(dateObj.getTime()) ? value : `${dateObj.toLocaleDateString('fr-FR')} ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if ((key === 'work_minutes' || key === 'pause_minutes' || key === 'duration') && typeof value === 'number') {
        return `${value} min`;
    }
    if (key === 'duration_seconds' && typeof value === 'number') {
        return `${Math.round(value / 60)} min`;
    }
    return String(value);
};

// ==========================================
// 3. SOUS-COMPOSANT : DETAIL CELLULE (CORRIGÉ)
// ==========================================
export function ChangeViewer({ log }: { log: ActivityLog }) {
    const { old_data: oldData, new_data: newData, source } = log;

    // Correction 1 : Le Hook useMemo doit TOUJOURS être appelé avant tout return conditionnel
    const changes = useMemo(() => {
        const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]));
        return allKeys.filter(key => JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key]));
    }, [oldData, newData]);

    // Rendu spécifique pour les arrêts machine
    if (source === 'downtime' && newData) {
        return (
            <VStack align="flex-start" spacing={1} fontSize="xs">
                {newData.reason && (
                    <Text color="gray.700">
                        <Text as="span" fontWeight="semibold" color="gray.500">Raison :</Text> {newData.reason}
                    </Text>
                )}
                {newData.start_time && (
                    <Text color="gray.700">
                        <Text as="span" fontWeight="semibold" color="gray.500">Du :</Text> {formatFieldValue('start_time', newData.start_time)}
                    </Text>
                )}
                {newData.end_time && (
                    <Text color="gray.700">
                        <Text as="span" fontWeight="semibold" color="gray.500">Au :</Text> {formatFieldValue('end_time', newData.end_time)}
                    </Text>
                )}
                {newData.duration_seconds !== undefined && (
                    <Text color="gray.700">
                        <Text as="span" fontWeight="semibold" color="gray.500">Durée totale :</Text> {formatFieldValue('duration_seconds', newData.duration_seconds)}
                    </Text>
                )}
            </VStack>
        );
    }

    // Comparateur delta classique pour les logs du ticket
    if (changes.length === 0) {
        if (newData && (newData.work_minutes !== undefined || newData.pause_minutes !== undefined)) {
            return (
                <VStack align="flex-start" spacing={1} fontSize="xs">
                    {newData.work_minutes !== undefined && (
                        <Text color="gray.600">Temps travaillé : <Text as="span" fontWeight="bold" color="gray.800">{newData.work_minutes} min</Text></Text>
                    )}
                    {newData.pause_minutes !== undefined && (
                        <Text color="gray.600">Pause : <Text as="span" fontWeight="bold" color="gray.800">{newData.pause_minutes} min</Text></Text>
                    )}
                </VStack>
            );
        }
        return <Text fontSize="xs" color="gray.400" fontStyle="italic">Aucun détail supplémentaire</Text>;
    }

    return (
        <VStack align="flex-start" spacing={1} fontSize="xs">
            {changes.map(key => (
                <HStack key={key} spacing={2} wrap="wrap">
                    <Text fontWeight="medium" color="gray.500">
                        {formatFieldLabel(key)} :
                    </Text>
                    {oldData?.[key] !== undefined && (
                        <Text as="span" color="red.600" textDecoration="line-through" bg="red.50" px={1} borderRadius="sm">
                            {formatFieldValue(key, oldData?.[key])}
                        </Text>
                    )}
                    {oldData?.[key] !== undefined && <Text as="span" color="gray.400">→</Text>}
                    <Text as="span" color="green.700" fontWeight="medium" bg="green.50" px={1} borderRadius="sm">
                        {formatFieldValue(key, newData?.[key])}
                    </Text>
                </HStack>
            ))}
        </VStack>
    );
}

// ==========================================
// 4. MAIN COMPONENT (OPTIMISÉ PROD)
// ==========================================
export default function TicketLogsTab({ ticket }: { ticket: Ticket }) {
    const [loading, setLoading] = useState(true);
    const [fetchedTicket, setFetchedTicket] = useState<Ticket | null>(null);
    const [error, setError] = useState<string | null>(null);

    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const tableHeaderBg = useColorModeValue('gray.100', 'gray.800');
    const tableRowHoverBg = useColorModeValue('gray.50', 'gray.700'); // Correction 5 : gray.750 n'existe pas

    // Correction 3 & 10 : Dépendance sur ticket.id pour éviter le loop infini, et isolation sécurisée du fetch
    useEffect(() => {
        const loadLogsData = async () => {
            if (!ticket?.id) return;
            try {
                setLoading(true);
                setError(null);

                // Correction 10 : Vérification stricte si les tableaux existent déjà
                const hasLogs = Array.isArray(ticket.logs);
                const hasDowntimeLogs = Array.isArray(ticket.downtime_logs);

                if (hasLogs && hasDowntimeLogs) {
                    setFetchedTicket(ticket);
                } else {
                    const res = await api.get(`/api/v1/tickets/${ticket.id}/`);
                    setFetchedTicket(res.data || ticket);
                }
            } catch (err) {
                console.error("Erreur traitement logs:", err);
                setError("Impossible de charger les données du journal d'intervention.");
            } finally {
                setLoading(false);
            }
        };

        loadLogsData();
    }, [ticket.id, ticket.logs, ticket.downtime_logs]);

    // Correction 11 : Plus de state fullLogs ! Remplacement par un useMemo global calculé à la volée
    const flatSortedLogs = useMemo(() => {
        if (!fetchedTicket) return [];

        // 1. Logs du ticket
        const rawTicketLogs = fetchedTicket.logs || [];
        const formattedTicketLogs: ActivityLog[] = rawTicketLogs.map((l: any) => ({
            ...l,
            source: 'ticket'
        }));

        // 2. Logs d'arrêts machine
        const rawDowntimes = fetchedTicket.downtime_logs || [];
        const formattedDowntimeLogs: ActivityLog[] = rawDowntimes.map((d: any) => {
            // Correction 4 : Sécurisation du statut (insensible à la casse)
            const isClosed = String(d.status).toLowerCase() === 'closed';

            return {
                id: d.id,
                action: isClosed ? "Arrêt machine clôturé" : "Arrêt machine détecté",
                performed_by_name: 'Système Automatique',
                // Correction 7 : Utilisation de end_time pour classer un arrêt clôturé, sinon start_time
                created_at: isClosed && d.end_time ? d.end_time : d.start_time,
                source: 'downtime',
                new_data: {
                    status: d.status,
                    reason: d.reason,
                    start_time: d.start_time,
                    end_time: d.end_time,
                    duration_seconds: d.duration_seconds
                }
            };
        });

        // 3. Fusion et Tri Chronologique Décroissant
        return [...formattedTicketLogs, ...formattedDowntimeLogs].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [fetchedTicket]);

    if (loading) {
        return (
            <Center py={14}>
                <VStack spacing={3}>
                    <Spinner size="xl" color="blue.500" thickness="3px" />
                    <Text fontSize="sm" color="gray.500" fontWeight="medium">
                        Génération du tableau unifié...
                    </Text>
                </VStack>
            </Center>
        );
    }

    if (error) {
        return (
            <Center py={10} px={4}>
                <Box textAlign="center" p={6} borderWidth="1px" borderRadius="xl" bg="red.50" borderColor="red.100" maxW="md">
                    <Text color="red.700" fontSize="sm" fontWeight="semibold">
                        {error}
                    </Text>
                </Box>
            </Center>
        );
    }

    return (
        <Box p={{ base: 2, md: 5 }} bg="white" borderRadius="xl" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
            <VStack align="stretch" spacing={5}>

                {/* Header */}
                <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                    <VStack align="flex-start" spacing={0}>
                        <Text fontSize="md" fontWeight="bold" color="gray.800">
                            Journal d'intervention industriel unifié
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            Flux fusionné des activités de maintenance (tickets) et des coupures de production (arrêts machines).
                        </Text>
                    </VStack>
                    {/* Correction 9 : Libellé plus naturel */}
                    <Badge colorScheme="blue" variant="subtle" px={2} py={1} borderRadius="md" fontSize="2xs" fontWeight="bold">
                        {flatSortedLogs.length} {flatSortedLogs.length > 1 ? 'événements' : 'événement'}
                    </Badge>
                </Flex>

                {/* Tableau global */}
                {flatSortedLogs.length > 0 ? (
                    <TableContainer borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Table variant="simple" size="sm">
                            <Thead bg={tableHeaderBg}>
                                <Tr>
                                    <Th width="200px" py={3}>Date (J/M/A - Heure)</Th>
                                    <Th width="180px">Utilisateur</Th>
                                    <Th width="220px">Action</Th>
                                    <Th>Détails</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {flatSortedLogs.map((log) => (
                                    // Correction 2 : Clé composite stable unique pour le DOM virtuel de React
                                    <Tr key={`${log.source}-${log.id}`} _hover={{ bg: tableRowHoverBg }} transition="background-color 0.15s">

                                        {/* 1. DATE */}
                                        <Td fontWeight="medium" color="gray.600" fontSize="xs">
                                            {formatTableDateTime(log.created_at)}
                                        </Td>

                                        {/* 2. UTILISATEUR */}
                                        <Td fontSize="xs">
                                            <Text fontWeight="semibold" color="gray.700">
                                                {log.performed_by_name || 'Système Automatique'}
                                            </Text>
                                        </Td>

                                        {/* 3. ACTION */}
                                        <Td fontSize="xs">
                                            <HStack spacing={2}>
                                                <Text fontWeight="bold" color="gray.800">
                                                    {log.action}
                                                </Text>
                                                {log.source === 'downtime' && (
                                                    // Correction 8 : Badge plus explicite pour l'industrie
                                                    <Badge colorScheme="red" variant="solid" fontSize="3xs" px={1.5} borderRadius="full">
                                                        ARRÊT MACHINE
                                                    </Badge>
                                                )}
                                            </HStack>
                                        </Td>

                                        {/* 4. DETAILS */}
                                        <Td py={3}>
                                            <ChangeViewer log={log} />
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Center py={12} borderWidth="1px" borderStyle="dashed" borderRadius="xl" bg="gray.50" borderColor="gray.300">
                        <VStack spacing={2}>
                            <Text fontSize="2xl">📋</Text>
                            <Text color="gray.500" fontSize="sm" fontWeight="medium">
                                Aucun événement ou arrêt détecté pour ce ticket.
                            </Text>
                        </VStack>
                    </Center>
                )}
            </VStack>
        </Box>
    );
}