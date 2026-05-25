import {
    Box,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Badge,
    VStack,
    Center,
    Spinner,
    Text,
    HStack,
    useBreakpointValue,
} from '@chakra-ui/react';

import { WarningIcon } from '@chakra-ui/icons';

import type { Ticket } from './types';


// ================= STATUS =================

const STATUS_COLORS: Record<string, string> = {
    draft: 'gray',
    planned: 'purple',
    in_progress: 'blue',
    completed: 'green',
    closed: 'orange',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Qualifié',
    planned: 'Planifié',
    in_progress: 'En cours',
    completed: 'Terminé',
    closed: 'Clôturé',
};


// ================= DATE =================

const formatDate = (dateString?: string): string => {

    if (!dateString) return '-';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};


// ================= TYPES =================

interface TicketTableProps {
    tickets: Ticket[];
    loading: boolean;
    onOpenTicket: (id: number) => void;
}


// ================= COMPONENT =================

export default function TicketTable({
    tickets,
    loading,
    onOpenTicket,
}: TicketTableProps) {

    const isMobile = useBreakpointValue({
        base: true,
        md: false,
    });

    return (

        <Box
            flex="1"
            overflowY="auto"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            bg="white"
        >

            {loading ? (

                <Center p={10}>
                    <Spinner color="purple.500" />
                </Center>

            ) : (

                <>
                    {!isMobile ? (

                        <Table variant="simple" size="md">

                            <Thead
                                bg="gray.50"
                                position="sticky"
                                top={0}
                                zIndex={1}
                            >

                                <Tr>
                                    <Th>Numéro</Th>
                                    <Th>Équipement</Th>
                                    <Th>Technicien</Th>
                                    <Th>Statut</Th>
                                    <Th>Créé le</Th>
                                    <Th>Planifié le</Th>
                                </Tr>

                            </Thead>

                            <Tbody>

                                {tickets.length === 0 ? (

                                    <Tr>
                                        <Td
                                            colSpan={6}
                                            textAlign="center"
                                            py={10}
                                            color="gray.400"
                                        >
                                            Aucune intervention trouvée
                                        </Td>
                                    </Tr>

                                ) : (

                                    tickets.map((ticket) => (

                                        <Tr
                                            key={ticket.id}
                                            cursor="pointer"
                                            _hover={{
                                                bg: 'gray.50',
                                            }}
                                            onClick={() =>
                                                onOpenTicket(ticket.id)
                                            }
                                        >

                                            <Td
                                                fontWeight="bold"
                                                color="purple.700"
                                            >
                                                #{ticket.number || ticket.id}
                                            </Td>

                                            <Td fontWeight="500">
                                                {ticket.equipment_name || 'N/A'}
                                            </Td>

                                            <Td
                                                fontSize="sm"
                                                color="gray.600"
                                            >
                                                {
                                                    ticket.completed_by_name ||
                                                    ticket.assigned_to_name ||
                                                    '-'
                                                }
                                            </Td>

                                            <Td>

                                                <Badge
                                                    colorScheme={
                                                        STATUS_COLORS[ticket.status] || 'gray'
                                                    }
                                                >
                                                    {
                                                        STATUS_LABELS[ticket.status] ||
                                                        ticket.status
                                                    }
                                                </Badge>

                                            </Td>

                                            <Td
                                                fontSize="xs"
                                                color="gray.500"
                                            >
                                                {formatDate(ticket.created_at)}
                                            </Td>

                                            <Td fontSize="xs">

                                                <HStack spacing={1}>

                                                    {ticket.is_late && (

                                                        <WarningIcon
                                                            color="red.500"
                                                            w={3}
                                                            h={3}
                                                        />

                                                    )}

                                                    <Text
                                                        fontWeight={
                                                            ticket.is_late
                                                                ? 'bold'
                                                                : 'normal'
                                                        }
                                                        color={
                                                            ticket.is_late
                                                                ? 'red.500'
                                                                : 'gray.600'
                                                        }
                                                    >
                                                        {formatDate(ticket.planned_at)}
                                                    </Text>

                                                </HStack>

                                            </Td>

                                        </Tr>

                                    ))

                                )}

                            </Tbody>

                        </Table>

                    ) : (

                        <VStack
                            spacing={3}
                            p={4}
                            align="stretch"
                        >

                            {tickets.length === 0 ? (

                                <Text
                                    textAlign="center"
                                    color="gray.400"
                                    py={4}
                                >
                                    Aucune intervention trouvée
                                </Text>

                            ) : (

                                tickets.map((ticket) => (

                                    <Box
                                        key={ticket.id}
                                        p={4}
                                        borderRadius="lg"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        cursor="pointer"
                                        onClick={() =>
                                            onOpenTicket(ticket.id)
                                        }
                                    >

                                        <HStack
                                            justify="space-between"
                                            mb={2}
                                        >

                                            <Text
                                                fontWeight="700"
                                                color="purple.700"
                                            >
                                                #{ticket.number || ticket.id}
                                            </Text>

                                            <Badge
                                                colorScheme={
                                                    STATUS_COLORS[ticket.status] || 'gray'
                                                }
                                            >
                                                {
                                                    STATUS_LABELS[ticket.status] ||
                                                    ticket.status
                                                }
                                            </Badge>

                                        </HStack>

                                        <Text
                                            fontWeight="600"
                                            fontSize="sm"
                                            mb={1}
                                        >
                                            {ticket.equipment_name || 'N/A'}
                                        </Text>

                                        <Text
                                            fontSize="xs"
                                            color="gray.500"
                                            mb={3}
                                        >
                                            Tech : {
                                                ticket.completed_by_name ||
                                                ticket.assigned_to_name ||
                                                '-'
                                            }
                                        </Text>

                                        <HStack justify="space-between">

                                            <HStack spacing={1}>

                                                {ticket.is_late && (

                                                    <WarningIcon
                                                        color="red.500"
                                                        w={3}
                                                        h={3}
                                                    />

                                                )}

                                                <Text
                                                    fontSize="xs"
                                                    color={
                                                        ticket.is_late
                                                            ? 'red.500'
                                                            : 'gray.500'
                                                    }
                                                >
                                                    {formatDate(ticket.planned_at)}
                                                </Text>

                                            </HStack>

                                        </HStack>

                                    </Box>

                                ))

                            )}

                        </VStack>

                    )}
                </>

            )}

        </Box>

    );
}