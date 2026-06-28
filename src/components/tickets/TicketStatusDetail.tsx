import {
    Alert, AlertIcon, Box, Center, Divider, HStack, Icon,
    Progress, SimpleGrid, Spinner, Stat, StatHelpText,
    StatLabel, StatNumber, Text, VStack, Heading, Badge
} from '@chakra-ui/react';
import { useMemo, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/apiClient';

import type { TicketStatusDetailProps, Ticket } from './types/ticket';
import {
    getStatusConfig, getPriorityColor, getProgressColor,
    getCriticalityColor, getCriticalityLabel
} from './types/ticketStatus';

import { TicketDelayBadge } from './TicketDelayBadge';
import { TicketActionButtons } from './TicketActionButtons';
import { TicketWorkStats } from './TicketWorkStats';


export default function TicketStatusDetail({ ticket }: TicketStatusDetailProps) {
    const statusConfig = useMemo(() => getStatusConfig(ticket.status), [ticket.status]);
    const StatusIcon = statusConfig.icon as ComponentType;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };
    return (
        <VStack spacing={6} align="stretch" width="100%">
            {/* SECTION STATUT & DETAILS */}
            <Box bg="white" borderRadius="xl" p={6} shadow="sm" border="1px solid" borderColor="gray.100">
                <VStack align="stretch" spacing={6}>
                    <HStack justify="space-between" align="flex-start" wrap="wrap" gap={4}>
                        <HStack spacing={4} align="flex-start">
                            <Box p={3} borderRadius="full" bg={`${statusConfig.color}.50`} color={`${statusConfig.color}.600`}>
                                <Icon as={StatusIcon} fontSize="xl" />
                            </Box>
                            <VStack align="flex-start" spacing={1}>
                                <HStack spacing={2} flexWrap="wrap">
                                    <Text fontSize="lg" fontWeight="bold">Statut : {statusConfig.label}</Text>
                                    {ticket.is_breakdown && <Badge colorScheme="red" variant="solid">Panne</Badge>}
                                    <TicketDelayBadge ticket={ticket as any} />
                                </HStack>
                                <Text fontSize="sm" color="gray.600">{statusConfig.description}</Text>
                            </VStack>
                        </HStack>
                        <HStack spacing={3}>
                            {ticket.priority && (
                                <Badge colorScheme={getPriorityColor(ticket.priority)} px={3} py={1}>
                                    Priorité : {ticket.priority}
                                </Badge>
                            )}
                            <TicketActionButtons ticket={ticket as any} />
                        </HStack>
                    </HStack>

                    <Box>
                        <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm" fontWeight="medium">Progression</Text>
                            <Text fontSize="sm" color="gray.600">{statusConfig.progress}%</Text>
                        </HStack>
                        <Progress value={statusConfig.progress} colorScheme={getProgressColor(statusConfig.progress)} size="lg" borderRadius="full" />
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Stat>
                            <StatLabel>Équipement</StatLabel>
                            <StatNumber fontSize="md">{ticket.equipment?.name ?? 'N/A'}</StatNumber>
                            <StatHelpText>{ticket.equipment?.code ?? 'Aucun code'}</StatHelpText>
                        </Stat>
                        <Stat>
                            <StatLabel>Technicien</StatLabel>
                            <StatNumber fontSize="md">{ticket.technician_name ?? 'Non assigné'}</StatNumber>
                            <StatHelpText>{ticket.intervention_type?.name ?? 'Non défini'}</StatHelpText>
                        </Stat>
                    </SimpleGrid>

                    <Divider />
                    <Box>
                        <Heading size="sm" mb={4} color="gray.700">Performances & Temps d'intervention</Heading>
                        <TicketWorkStats ticket={ticket as any} />
                    </Box>

                    {ticket.equipment && (
                        <>
                            <Divider />
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                {Object.entries(ticket.equipment).map(([key, val]) => (
                                    key !== 'name' && key !== 'code' && (
                                        <Stat key={key}>
                                            <StatLabel textTransform="capitalize">{key}</StatLabel>
                                            <StatNumber fontSize="md">{val}</StatNumber>
                                        </Stat>
                                    )
                                ))}
                            </SimpleGrid>
                        </>
                    )}
                </VStack>
            </Box>
        </VStack>
    );
}




