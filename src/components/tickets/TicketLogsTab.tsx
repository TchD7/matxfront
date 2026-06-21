import {
    Box,
    VStack,
    Text,
    Spinner,
    Center,
    Badge,
    Flex,
    Circle,
    HStack
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/apiClient';

// ================= TYPES =================
export interface TicketLogData {
    planned_at?: string;
    technician_name?: string;
}

export interface TicketLog {
    id: number;
    action: string;
    old_data?: TicketLogData;
    new_data?: TicketLogData;
    performed_by_name?: string;
    created_at: string;
}

export interface Ticket {
    id: string | number;
}

// ================= HELPERS =================
const getActionColor = (action: string) => {
    switch (action) {
        case 'created': return 'blue';
        case 'assigned': return 'purple';
        case 'started': return 'orange';
        case 'paused': return 'yellow';
        case 'resumed': return 'green';
        case 'completed': return 'green';
        case 'closed': return 'teal';
        default: return 'gray';
    }
};

const getLogDetails = (log: TicketLog): string => {
    switch (log.action) {
        case 'created':
            return 'Le ticket a été créé dans le système.';
        case 'assigned': {
            const tech = log.new_data?.technician_name || 'Technicien inconnu';
            const planned = log.new_data?.planned_at
                ? new Date(log.new_data.planned_at).toLocaleDateString('fr-FR')
                : 'date inconnue';
            return `Assigné à ${tech} pour le ${planned}.`;
        }
        case 'started':
            return 'Le technicien a démarré l’intervention.';
        case 'paused':
            return 'L’intervention a été mise en pause.';
        case 'resumed':
            return 'L’intervention a repris.';
        case 'completed':
            return 'Le travail technique a été terminé.';
        case 'closed':
            return 'Le ticket a été validé et clôturé.';
        case 'created_by_duplication':
            return 'Créé à partir d’une duplication.';
        default:
            if (log.action.startsWith('duplicated_from_')) {
                const sourceId = log.action.split('_').pop();
                return `Dupliqué depuis le ticket #${sourceId}.`;
            }
            return 'Aucun détail supplémentaire.';
    }
};

// ================= COMPONENT =================
export default function TicketLogsTab({ ticket }: { ticket: Ticket }) {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<TicketLog[]>([]);

    // ================= FETCH =================
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/v1/tickets/${ticket.id}/logs/`);
                const data = res.data;
                setLogs(Array.isArray(data) ? data : data.logs || []);
            } catch (error) {
                console.error('Erreur chargement logs:', error);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        if (ticket?.id) {
            fetchLogs();
        }
    }, [ticket?.id]);

    // ================= SORT =================
    const sortedLogs = useMemo(() => {
        return [...logs].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [logs]);

    // ================= UI =================
    if (loading) {
        return (
            <Center py={10}>
                <Spinner size="xl" color="blue.500" />
            </Center>
        );
    }

    return (
        <Box p={4}>
            <VStack align="stretch" spacing={6}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    Historique des actions
                </Text>

                <VStack align="stretch" spacing={0} position="relative">
                    {sortedLogs.length > 0 ? (
                        sortedLogs.map((log, index) => {
                            const dateObj = new Date(log.created_at);
                            const dateStr = dateObj.toLocaleDateString('fr-FR');
                            const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            const badgeColor = getActionColor(log.action);

                            return (
                                <Flex key={log.id} position="relative" pb={index === sortedLogs.length - 1 ? 0 : 6}>
                                    {/* Ligne de connexion verticale */}
                                    {index !== sortedLogs.length - 1 && (
                                        <Box position="absolute" left="11px" top="24px" bottom="0" width="2px" bg="gray.200" zIndex={0} />
                                    )}

                                    {/* Point de la timeline */}
                                    <Circle size="24px" bg={`${badgeColor}.500`} color="white" zIndex={1} mt={1} mr={4} />

                                    {/* Contenu du log */}
                                    <Box bg="white" p={4} borderRadius="md" flex={1} borderWidth="1px" shadow="sm">
                                        <Flex justify="space-between" align="flex-start" mb={2} wrap="wrap" gap={2}>
                                            <HStack>
                                                <Badge colorScheme={badgeColor} borderRadius="md" px={2} py={0.5}>
                                                    {log.action}
                                                </Badge>
                                                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                                                    {log.performed_by_name || 'Système'}
                                                </Text>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500" fontWeight="medium">
                                                {dateStr} à {timeStr}
                                            </Text>
                                        </Flex>
                                        <Text fontSize="sm" color="gray.600">
                                            {getLogDetails(log)}
                                        </Text>
                                    </Box>
                                </Flex>
                            );
                        })
                    ) : (
                        <Box textAlign="center" py={10} borderWidth="1px" borderRadius="lg" bg="gray.50">
                            <Text color="gray.500" fontSize="sm">
                                Aucun historique disponible.
                            </Text>
                        </Box>
                    )}
                </VStack>
            </VStack>
        </Box>
    );
}