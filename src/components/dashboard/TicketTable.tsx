import {
    Box, Table, Tbody, Td, Th, Thead, Tr, Badge, VStack, Center, Spinner, Text, HStack, useBreakpointValue, Flex
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import type { Ticket } from './types';

// On utilise des nuances qui garantissent une lisibilité du texte (blanc ou noir)
const STATUS_COLORS = {
    draft: { bg: 'gray.100', color: 'gray.800' },       // Gris neutre
    planned: { bg: 'purple.100', color: 'purple.800' }, // Contraste fort violet
    in_progress: { bg: 'blue.100', color: 'blue.800' }, // Bleu institutionnel
    paused: { bg: 'yellow.100', color: 'yellow.900' },  // Jaune sombre pour lisibilité
    completed: { bg: 'green.100', color: 'green.800' }, // Vert standard
    closed: { bg: 'gray.200', color: 'gray.600' },      // Gris plus sombre (archivage)
};

const STATUS_LABELS: Record<Ticket['status'], string> = {
    draft: 'Qualifié',
    planned: 'Planifié',
    in_progress: 'En cours',
    completed: 'Terminé',
    closed: 'Clôturé',
    paused: 'En pause',
};

const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return '-';

    const day = date.toLocaleDateString('fr-FR'); // 29/06/2026
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); // 22:12

    return `${day} à ${time}`;
};

interface TicketTableProps {
    tickets: Ticket[];
    loading: boolean;
    onOpenTicket: (id: string) => void;
}

export default function SortableTicketTable({ tickets, loading, onOpenTicket }: TicketTableProps) {
    const isMobile = useBreakpointValue({ base: true, md: false });

    if (loading) return <Center p={10}><Spinner color="purple.500" size="xl" /></Center>;
    if (tickets.length === 0) return <Center p={10} color="gray.400">Aucune intervention trouvée</Center>;

    return (
        <Box overflowX="auto" borderRadius="lg" border="1px solid" borderColor="gray.200" bg="white">
            {!isMobile ? (
                <Table variant="simple" size="md">
                    <Thead>
                        <Tr>
                            {/* Titres en majuscules légères comme sur l'image */}
                            {['NUMÉRO', 'INTERVENTION', 'CRÉÉ LE', 'PLANIFIÉ LE', 'TECHNICIEN', 'STATUT'].map((header) => (
                                <Th key={header} fontSize="xs" color="gray.500" letterSpacing="wider">{header}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {tickets.map((t) => (
                            <Tr key={t.id} cursor="pointer" _hover={{ bg: 'gray.50' }} onClick={() => onOpenTicket(t.id)}>
                                {/* Numéro avec badge type "PROJECT" en dessous */}
                                <Td py={4}>
                                    <VStack align="flex-start" spacing={0}>
                                        <Text fontWeight="bold">{t.number || t.id}</Text>
                                        <Badge variant="subtle" colorScheme="red" fontSize="xx-small" textTransform="uppercase">
                                            {t.is_breakdown && <Text >Arrêt machine</Text>}
                                        </Badge>
                                    </VStack>
                                </Td>

                                <Td fontWeight="medium">{t.intervention_type?.name || 'Standard'}</Td>

                                {/* Date et Nom sur deux lignes */}
                                <Td>
                                    <VStack align="flex-start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="bold">{formatDate(t.created_at).split(' ')[0]}</Text>
                                        <Text fontSize="xs" color="gray.500">
                                            {formatDate(t.created_at).split(' à ')[1] || '-'}
                                        </Text>
                                    </VStack>
                                </Td>

                                <Td>
                                    <Text fontSize="sm" fontWeight="medium">{formatDate(t.planned_at).split(' ')[0]}</Text>
                                    <Text fontSize="xs" color="gray.500">
                                        {formatDate(t.planned_at).split(' à ')[1] || '-'}
                                    </Text>
                                </Td>

                                {/* Technicien avec contact */}
                                <Td>
                                    <VStack align="flex-start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="bold">{t.technician_name || 'Non assigné'}</Text>

                                    </VStack>
                                </Td>

                                {/* Statut plein (solid) au lieu de subtil pour coller au look pro */}
                                <Td>
                                    <Badge
                                        bg={STATUS_COLORS[t.status].bg}
                                        color={STATUS_COLORS[t.status].color}
                                        px={2}
                                        py={1}

                                        fontWeight="bold" // Augmente la lisibilité
                                        textTransform="uppercase"
                                        fontSize="xx-small"
                                        border="1px solid"
                                        borderColor="blackAlpha.100" // Ajoute une délimitation fine pour le contraste
                                    >
                                        {STATUS_LABELS[t.status]}
                                    </Badge>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            ) : (
                <VStack spacing={0} align="stretch" divider={<Box borderBottom="1px solid" borderColor="gray.100" />}>
                    {tickets.map((t) => (
                        <Box key={t.id} p={4} _hover={{ bg: 'gray.50' }} cursor="pointer" onClick={() => onOpenTicket(t.id)}>
                            <HStack justify="space-between" mb={2}>
                                <Text fontWeight="bold" color="purple.700">{t.number || t.id}</Text>
                                <Badge
                                    bg={STATUS_COLORS[t.status].bg}
                                    color={STATUS_COLORS[t.status].color}
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                    fontWeight="bold" // Augmente la lisibilité
                                    textTransform="uppercase"
                                    fontSize="xx-small"
                                    border="1px solid"
                                    borderColor="blackAlpha.100" // Ajoute une délimitation fine pour le contraste
                                >
                                    {STATUS_LABELS[t.status]}
                                </Badge>
                            </HStack>
                            <Text fontWeight="semibold">{t.intervention_type?.name}</Text>
                            <HStack mt={1} mb={2}>
                                <Text fontSize="sm" color="gray.600">{t.equipment_name || 'N/A'}</Text>
                                {t.is_breakdown && <Badge colorScheme="red" variant="subtle">Urgent</Badge>}
                            </HStack>
                            <Text fontSize="xs" color="gray.500">Tech: {t.technician_name || 'Non assigné'}</Text>
                            <Text fontSize="xs" color="gray.500" mt={1}>Prévu: {formatDate(t.planned_at)}</Text>
                        </Box>
                    ))}
                </VStack>
            )}
        </Box>
    );
}