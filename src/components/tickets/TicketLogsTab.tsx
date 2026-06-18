import {
    Box,
    VStack,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    Center,
    Badge,
} from '@chakra-ui/react';

import { useEffect, useMemo, useState } from 'react';
import { formatDateTime } from '../../utils/userUtils';
import api from '../../api/apiClient';

// ================= TYPES =================
interface TicketLogData {
    planned_at?: string;
    technician_name?: string;
}

interface TicketLog {
    id: number;
    action: string;
    old_data?: TicketLogData;
    new_data?: TicketLogData;
    performed_by_name?: string;
    created_at: string;
}

interface Ticket {
    id: string;
}

// ================= HELPERS =================

const getActionColor = (action: string) => {
    switch (action) {
        case 'created':
            return 'blue';

        case 'assigned':
            return 'purple';

        case 'started':
            return 'orange';

        case 'completed':
            return 'green';

        case 'closed':
            return 'teal';

        default:
            return 'gray';
    }
};

// ================= DETAILS =================
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
export default function TicketLogsTab({
    ticket,
}: {
    ticket: Ticket;
}) {

    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<TicketLog[]>([]);

    // ================= FETCH =================
    useEffect(() => {

        const fetchLogs = async () => {
            try {

                setLoading(true);

                const res = await api.get(
                    `/api/v1/tickets/${ticket.id}/logs/`
                );

                const data = res.data;

                setLogs(
                    Array.isArray(data)
                        ? data
                        : data.logs || []
                );

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
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        );
    }, [logs]);

    // ================= LOADING =================
    if (loading) {
        return (
            <Center py={10}>
                <Spinner size="xl" color="purple.500" />
            </Center>
        );
    }

    // ================= UI =================
    return (
        <Box p={4}>

            <VStack align="stretch" spacing={4}>

                <Text fontSize="lg" fontWeight="bold">
                    Historique des actions
                </Text>

                <Box
                    borderWidth="1px"
                    borderRadius="lg"
                    overflowX="auto"
                    boxShadow="sm"
                    bg="white"
                >

                    <Table size="md" variant="simple">

                        <Thead bg="gray.50">

                            <Tr>
                                <Th>Date</Th>
                                <Th>Utilisateur</Th>
                                <Th>Action</Th>
                                <Th>Détails</Th>
                            </Tr>

                        </Thead>

                        <Tbody>

                            {sortedLogs.length > 0 ? (

                                sortedLogs.map((log) => (

                                    <Tr
                                        key={log.id}
                                        _hover={{
                                            bg: 'gray.50',
                                        }}
                                    >

                                        {/* DATE */}
                                        <Td fontSize="sm">
                                            {formatDateTime(log.created_at)}
                                        </Td>

                                        {/* UTILISATEUR */}
                                        <Td fontSize="sm">
                                            {log.performed_by_name || 'Système'}
                                        </Td>

                                        {/* ACTION */}
                                        <Td>
                                            <Badge
                                                colorScheme={getActionColor(log.action)}
                                                borderRadius="md"
                                            >
                                                {log.action}
                                            </Badge>
                                        </Td>

                                        {/* DETAILS */}
                                        <Td fontSize="sm" color="gray.700">
                                            {getLogDetails(log)}
                                        </Td>

                                    </Tr>

                                ))

                            ) : (

                                <Tr>
                                    <Td
                                        colSpan={4}
                                        textAlign="center"
                                        py={10}
                                    >
                                        <Text
                                            color="gray.500"
                                            fontSize="sm"
                                        >
                                            Aucun historique disponible.
                                        </Text>
                                    </Td>
                                </Tr>

                            )}

                        </Tbody>

                    </Table>

                </Box>

            </VStack>

        </Box>
    );
}