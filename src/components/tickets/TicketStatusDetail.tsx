import {
    Alert, AlertIcon, Box, Center, Divider, HStack, Icon,
    Progress, SimpleGrid, Spinner, Stat, StatHelpText,
    StatLabel, StatNumber, Text, VStack, Heading, Badge
} from '@chakra-ui/react';
import { useMemo, type ComponentType } from 'react';

import type { TicketStatusDetailProps } from './types/ticket';
import {
    getStatusConfig, getPriorityColor, getProgressColor,

} from './types/ticketStatus';

import { TicketDelayBadge } from './TicketDelayBadge';
import { TicketActionButtons } from './TicketActionButtons';
import { TicketWorkStats } from './TicketWorkStats';


export default function TicketStatusDetail({ ticket }: TicketStatusDetailProps) {
    const statusConfig = useMemo(() => getStatusConfig(ticket.status), [ticket.status]);
    const StatusIcon = statusConfig.icon as ComponentType;

    // Version améliorée pour gérer les messages métier
    const formatDate = (dateString?: string | null, emptyMsg: string = 'Non défini'): string => {
        if (!dateString) return emptyMsg;
        const date = new Date(dateString);
        return isNaN(date.getTime())
            ? emptyMsg
            : date.toLocaleString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
    };

    return (
        <VStack spacing={6} align="stretch" w="full">
            {/* CARD PRINCIPALE */}
            <Box bg="white" borderRadius="xl" p={6} shadow="sm" border="1px solid" borderColor="gray.100">
                <VStack align="stretch" spacing={6}>

                    {/* HEADER : ICONE + STATUT + ACTIONS */}
                    <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
                        <HStack spacing={4}>
                            <Box p={3} borderRadius="lg" bg={`${statusConfig.color}.50`} color={`${statusConfig.color}.600`}>
                                <Icon as={StatusIcon} boxSize={6} />
                            </Box>
                            <VStack align="flex-start" spacing={0}>
                                <HStack>
                                    <Text fontSize="lg" fontWeight="bold">Statut : {statusConfig.label}</Text>
                                    <TicketDelayBadge ticket={ticket as any} />
                                </HStack>
                                <Text fontSize="sm" color="gray.500">{statusConfig.description}</Text>
                            </VStack>
                        </HStack>

                        <HStack spacing={3}>
                            {ticket.priority && (
                                <Badge colorScheme={getPriorityColor(ticket.priority)} px={3} py={1} borderRadius="md">
                                    {ticket.priority}
                                </Badge>
                            )}
                            <TicketActionButtons ticket={ticket as any} />
                        </HStack>
                    </HStack>

                    <Divider />

                    {/* INFOS EQUIPEMENT & TECHNICIEN (Style "CRM") */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                        <Box p={4} bg="gray.50" borderRadius="lg">
                            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={2}>Équipement</Text>
                            <Text fontWeight="semibold" fontSize="md">{ticket.equipment?.name ?? 'Non spécifié'}</Text>
                            <Text fontSize="sm" color="gray.600">{ticket.equipment?.code ?? 'Sans code'}</Text>
                        </Box>
                        <Box p={4} bg="gray.50" borderRadius="lg">
                            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={2}>Technicien</Text>
                            <Text fontWeight="semibold" fontSize="md">{ticket.technician_name ?? 'Non assigné'}</Text>
                            <Text fontSize="sm" color="gray.600">{ticket.intervention_type?.name ?? 'Type non défini'}</Text>
                        </Box>
                    </SimpleGrid>

                    <Divider />

                    {/* SECTION PERFORMANCES */}
                    <Box>
                        <Heading size="xs" color="gray.500" textTransform="uppercase" mb={4}>Performances & Temps</Heading>
                        <TicketWorkStats ticket={ticket as any} />
                    </Box>

                    <Divider />

                    {/* TIMELINE DE DATES (Plus lisible) */}
                    <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={6}>
                        {[
                            { label: 'Créé le', value: ticket.created_at, msg: 'Non créé' },
                            { label: 'Planifié le', value: ticket.planned_at, msg: 'Non planifié' },
                            { label: 'Débuté le', value: ticket.started_at, msg: 'En attente' },
                            { label: 'Clôturé le', value: ticket.ended_at, msg: 'En cours' },
                        ].map((item, idx) => (
                            <VStack align="flex-start" key={idx} spacing={1}>
                                <Text fontSize="xs" color="gray.400" fontWeight="bold">{item.label.toUpperCase()}</Text>
                                <Text fontSize="sm" fontWeight="medium" color={!item.value ? "gray.400" : "gray.800"}>
                                    {formatDate(item.value, item.msg)}
                                </Text>
                            </VStack>
                        ))}
                    </SimpleGrid>

                </VStack>
            </Box>
        </VStack>
    );
}