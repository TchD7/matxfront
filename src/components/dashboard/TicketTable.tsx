import {
    Box, Table, Tbody, Td, Th, Thead, Tr, Badge, VStack, Center, Spinner, Text, HStack, useBreakpointValue
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import type { Ticket } from './types';

const STATUS_COLORS: Record<string, string> = {
    draft: 'gray', planned: 'purple', in_progress: 'blue', completed: 'green', closed: 'orange',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Qualifié', planned: 'Planifié', in_progress: 'En cours', completed: 'Terminé', closed: 'Clôturé',
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

interface TicketTableProps {
    tickets: Ticket[];
    loading: boolean;
    onOpenTicket: (id: string | number) => void; // On passe l'objet entier pour plus de flexibilité
}

export default function TicketTable({ tickets, loading, onOpenTicket }: TicketTableProps) {
    const isMobile = useBreakpointValue({ base: true, md: false });

    if (loading) {
        return (
            <Center p={10}>
                <Spinner color="purple.500" size="xl" />
            </Center>
        );
    }

    if (tickets.length === 0) {
        return <Center p={10} color="gray.400">Aucune intervention trouvée</Center>;
    }

    return (
        <Box flex="1" overflowY="auto" borderRadius="lg" border="1px solid" borderColor="gray.200" bg="white">
            {!isMobile ? (
                <Table variant="simple" size="md">
                    <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                        <Tr>
                            <Th>Numéro</Th><Th>Équipement</Th><Th>Technicien</Th><Th>Statut</Th><Th>Créé le</Th><Th>Planifié le</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {tickets.map((t) => (
                            <Tr key={t.id} cursor="pointer" _hover={{ bg: 'gray.50' }} onClick={() => onOpenTicket(t.id)}>
                                <Td fontWeight="bold" color="purple.700">#{t.number || t.id}</Td>
                                <Td>{t.equipment_name || 'N/A'}</Td>
                                <Td>{t.completed_by_name || t.assigned_to_name || '-'}</Td>
                                <Td><Badge colorScheme={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status] || t.status}</Badge></Td>
                                <Td fontSize="xs" color="gray.500">{formatDate(t.created_at)}</Td>
                                <Td>
                                    <HStack color={t.is_late ? 'red.500' : 'gray.600'}>
                                        {t.is_late && <WarningIcon w={3} h={3} />}
                                        <Text fontWeight={t.is_late ? 'bold' : 'normal'}>{formatDate(t.planned_at)}</Text>
                                    </HStack>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            ) : (
                <VStack spacing={3} p={4} align="stretch">
                    {tickets.map((t) => (
                        <Box key={t.id} p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" onClick={() => onOpenTicket(t)}>
                            <HStack justify="space-between" mb={2}>
                                <Text fontWeight="700" color="purple.700">#{t.number || t.id}</Text>
                                <Badge colorScheme={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                            </HStack>
                            <Text fontWeight="600" mb={1}>{t.equipment_name || 'N/A'}</Text>
                            <Text fontSize="xs" color="gray.500" mb={3}>Tech: {t.completed_by_name || t.assigned_to_name || '-'}</Text>
                            <HStack color={t.is_late ? 'red.500' : 'gray.500'}>
                                {t.is_late && <WarningIcon w={3} h={3} />}
                                <Text fontSize="xs">{formatDate(t.planned_at)}</Text>
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            )}
        </Box>
    );
}