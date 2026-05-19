import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Badge,
    Button,
    Divider,
} from '@chakra-ui/react';

// ================= TYPES =================
interface Ticket {
    id: string;
    number?: string;
    status: string;
    is_breakdown?: boolean;
    planned_at?: string;
    started_at?: string;
    ended_at?: string;

    equipment?: {
        name?: string;
        code?: string;
        criticality?: string;
    };

    intervention_type?: {
        name?: string;
    };
}

// ================= STATUS STYLE =================
const getStatus = (status: string) => {
    switch (status) {
        case 'draft':
            return { label: 'Brouillon', color: 'gray' };
        case 'planned':
            return { label: 'Planifié', color: 'purple' };
        case 'in_progress':
            return { label: 'En cours', color: 'blue' };
        case 'completed':
            return { label: 'Terminé', color: 'green' };
        case 'closed':
            return { label: 'Clôturé', color: 'orange' };
        default:
            return { label: status, color: 'gray' };
    }
};

// ================= COMPONENT =================
export default function TicketHeader({
    ticket,
    onBack,
    onAction,
}: {
    ticket: Ticket;
    onBack?: () => void;
    onAction?: (action: string) => void;
}) {
    const status = getStatus(ticket.status);

    return (
        <Box
            bg="white"
            borderBottom="1px solid"
            borderColor="gray.100"
            p={4}
        >
            <Flex justify="space-between" align="center">

                {/* LEFT INFO */}
                <VStack align="start" spacing={1}>
                    <VStack align="flex-start" spacing={1}>
                        <HStack>
                            <Text fontSize="lg" fontWeight="bold">
                                Ticket {ticket.number || 'N° inconnu'}
                            </Text>

                            <Badge colorScheme={status.color}>
                                {status.label}
                            </Badge>

                            {ticket.is_breakdown && (
                                <Badge colorScheme="red">
                                    Panne
                                </Badge>
                            )}
                        </HStack>

                        <Text fontSize="sm" color="gray.500">
                            {ticket.equipment?.name} ({ticket.equipment?.code})
                        </Text>

                        <HStack spacing={2}>
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">
                                Type d'intervention:
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                                {ticket.intervention_type?.name || 'Non défini'}
                            </Text>
                        </HStack>
                    </VStack>
                </VStack>

                {/* RIGHT ACTIONS */}
                <HStack spacing={3}>

                    {onBack && (
                        <Button size="sm" variant="ghost" onClick={onBack}>
                            Retour
                        </Button>
                    )}

                    {/* DELETE BUTTON - Always visible */}
                    {onAction && (
                        <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => onAction('delete')}
                        >
                            Supprimer
                        </Button>
                    )}

                    {ticket.status === 'planned' && onAction && (
                        <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => onAction('start')}
                        >
                            Démarrer
                        </Button>
                    )}

                    {ticket.status === 'in_progress' && onAction && (
                        <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => onAction('complete')}
                        >
                            Terminer
                        </Button>
                    )}

                    {ticket.status === 'completed' && onAction && (
                        <Button
                            size="sm"
                            colorScheme="orange"
                            onClick={() => onAction('close')}
                        >
                            Clôturer
                        </Button>
                    )}

                </HStack>
            </Flex>

            <Divider mt={3} />
        </Box>
    );
}