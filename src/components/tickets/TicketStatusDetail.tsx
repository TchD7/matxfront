import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Center,
    Divider,
    HStack,
    Icon,
    Progress,
    SimpleGrid,
    Spinner,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
    Text,
    VStack,
    Heading
} from '@chakra-ui/react';
import { useMemo, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    FiAlertCircle,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiPlay,
    FiPauseCircle
} from 'react-icons/fi';

// Imports des nouveaux composants métier créés précédemment
import { TicketDelayBadge } from './TicketDelayBadge';
import { TicketActionButtons } from './TicketActionButtons';
import { TicketWorkStats } from './TicketWorkStats';

import { formatDuration } from './types/ticket'; // L'utilitaire centralisé

export interface TicketStatusDetailProps {
    ticket: {
        id: string | number;
        status: string;
        created_at: string;
        started_at?: string | null;
        ended_at?: string | null;
        planned_at?: string | null;
        is_breakdown?: boolean;
        priority?: string | null;
        equipment?: {
            name?: string;
            code?: string;
            criticality?: string;
            emplacement?: string;
            series?: string;
            marque?: string;
        } | null;
        technician_name?: string | null;
        intervention_type?: {
            name?: string;
        } | null;

        // --- Nouveaux champs backend ---
        is_late?: boolean;
        start_delay_minutes?: number | null;
        late_duration_minutes?: number | null;
        total_work_minutes?: number;
        pause_minutes?: number;
        pause_count?: number;
        logs?: any[];
    };
}

const getPriorityColor = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
        case 'urgent':
        case 'high':
            return 'red';
        case 'medium':
            return 'orange';
        case 'low':
            return 'green';
        default:
            return 'blue';
    }
};

const getProgressColor = (progress: number) => {
    if (progress <= 33) return 'red';
    if (progress <= 66) return 'orange';
    return 'green';
};

const getCriticalityColor = (criticality?: string | null) => {
    switch (criticality?.toLowerCase()) {
        case 'critical':
            return 'red';
        case 'high':
            return 'orange';
        case 'medium':
            return 'yellow';
        default:
            return 'gray';
    }
};

const getCriticalityLabel = (criticality?: string | null) => {
    switch (criticality?.toLowerCase()) {
        case 'critical':
            return 'Critique';
        case 'high':
            return 'Élevée';
        case 'medium':
            return 'Moyenne';
        default:
            return 'Normale';
    }
};

const getStatusConfig = (status?: string) => {
    const normalized = status?.toLowerCase();

    switch (normalized) {
        case 'draft':
            return {
                icon: FiClock,
                label: 'Brouillon',
                color: 'gray',
                progress: 0,
                description: 'Le ticket est en brouillon et n’est pas encore planifié.',
            };
        case 'planned':
            return {
                icon: FiCalendar,
                label: 'Planifié',
                color: 'purple',
                progress: 20,
                description: 'Le ticket est planifié.',
            };
        case 'in_progress':
        case 'in progress':
            return {
                icon: FiPlay,
                label: 'En cours',
                color: 'blue',
                progress: 60,
                description: 'Le ticket est en cours de traitement.',
            };
        case 'paused':
            return {
                icon: FiPauseCircle,
                label: 'En pause',
                color: 'yellow',
                progress: 60,
                description: "L'intervention est actuellement en pause.",
            };
        case 'completed':
            return {
                icon: FiCheckCircle,
                label: 'Terminé',
                color: 'green',
                progress: 100,
                description: 'Le ticket est terminé.',
            };
        case 'closed':
            return {
                icon: FiAlertCircle,
                label: 'Clôturé',
                color: 'orange',
                progress: 100,
                description: 'Le ticket est fermé.',
            };
        default:
            return {
                icon: FiAlertCircle,
                label: 'Inconnu',
                color: 'gray',
                progress: 0,
                description: 'Statut inconnu.',
            };
    }
};

interface FieldRendererProps {
    ticketId: string | number;
    field: any;
}

function FieldRenderer({ field }: FieldRendererProps) {
    const value = field.value ?? field.placeholder ?? 'N/A';
    return (
        <Text fontSize="sm" color="gray.700">
            {value}
        </Text>
    );
}

export default function TicketStatusDetail({ ticket }: TicketStatusDetailProps) {
    // =========================================================
    // STATUS CONFIG
    // =========================================================

    const statusConfig = useMemo(() => getStatusConfig(ticket.status), [ticket.status]);
    const StatusIcon = statusConfig.icon as ComponentType;

    // =========================================================
    // DYNAMIC FORM
    // =========================================================

    const {
        data: dynamicForm = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['ticket-form', ticket.id],
        queryFn: async () => {
            const response = await axios.get(`/api/v1/tickets/${ticket.id}/render/`);
            return response.data;
        },
        enabled: Boolean(ticket.id),
        staleTime: 1000 * 60 * 5,
    });

    // =========================================================
    // UI
    // =========================================================

    return (
        <VStack spacing={6} align="stretch" width="100%">
            {/* ================================================= */}
            {/* STATUS DETAIL */}
            {/* ================================================= */}

            <Box
                bg="white"
                borderRadius="xl"
                p={6}
                shadow="sm"
                border="1px solid"
                borderColor="gray.100"
            >
                <VStack align="stretch" spacing={6}>
                    <HStack justify="space-between" align="flex-start" wrap="wrap" gap={4}>
                        <HStack spacing={4} align="flex-start">
                            <Box
                                p={3}
                                borderRadius="full"
                                bg={`${statusConfig.color}.50`}
                                color={`${statusConfig.color}.600`}
                            >
                                <Icon as={StatusIcon} fontSize="xl" />
                            </Box>

                            <VStack align="flex-start" spacing={1}>
                                <HStack spacing={2} flexWrap="wrap">
                                    <Text fontSize="lg" fontWeight="bold">
                                        Statut : {statusConfig.label}
                                    </Text>

                                    {ticket.is_breakdown && (
                                        <Badge colorScheme="red" variant="solid">
                                            Panne
                                        </Badge>
                                    )}

                                    {/* Nouveau composant gérant l'affichage exclusif des retards */}
                                    <TicketDelayBadge ticket={ticket as any} />
                                </HStack>

                                <Text fontSize="sm" color="gray.600">
                                    {statusConfig.description}
                                </Text>
                            </VStack>
                        </HStack>

                        <HStack spacing={3}>
                            {ticket.priority && (
                                <Badge
                                    colorScheme={getPriorityColor(ticket.priority)}
                                    px={3}
                                    py={1}
                                >
                                    Priorité : {ticket.priority}
                                </Badge>
                            )}

                            {/* Boutons d'action Pause / Reprise avec leurs modals */}
                            <TicketActionButtons ticket={ticket as any} />
                        </HStack>
                    </HStack>

                    {/* PROGRESS */}
                    <Box>
                        <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm" fontWeight="medium">
                                Progression
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                {statusConfig.progress}%
                            </Text>
                        </HStack>

                        <Progress
                            value={statusConfig.progress}
                            colorScheme={getProgressColor(statusConfig.progress)}
                            size="lg"
                            borderRadius="full"
                        />
                    </Box>

                    {/* METRICS DE BASE */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Stat>
                            <StatLabel>Équipement</StatLabel>
                            <StatNumber fontSize="md">
                                {ticket.equipment?.name ?? 'N/A'}
                            </StatNumber>
                            <StatHelpText>
                                {ticket.equipment?.code ?? 'Aucun code'}
                            </StatHelpText>
                        </Stat>

                        <Stat>
                            <StatLabel>Technicien</StatLabel>
                            <StatNumber fontSize="md">
                                {ticket.technician_name ?? 'Non assigné'}
                            </StatNumber>
                            <StatHelpText>
                                {ticket.intervention_type?.name ?? 'Non défini'}
                            </StatHelpText>
                        </Stat>
                    </SimpleGrid>

                    <Divider />

                    {/* TEMPS D'INTERVENTION (Nouveaux KPIs) */}
                    <Box>
                        <Heading size="sm" mb={4} color="gray.700">
                            Performances & Temps d'intervention
                        </Heading>
                        <TicketWorkStats ticket={ticket as any} />
                    </Box>

                    {/* EQUIPMENT (Détails) */}
                    {ticket.equipment && (
                        <>
                            <Divider />
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                <Stat>
                                    <StatLabel>Nom</StatLabel>
                                    <StatNumber fontSize="md">{ticket.equipment.name}</StatNumber>
                                </Stat>
                                <Stat>
                                    <StatLabel>Code</StatLabel>
                                    <StatNumber fontSize="md">{ticket.equipment.code}</StatNumber>
                                </Stat>
                                <Stat>
                                    <StatLabel>Criticité</StatLabel>
                                    <Box mt={2}>
                                        <Badge colorScheme={getCriticalityColor(ticket.equipment.criticality)}>
                                            {getCriticalityLabel(ticket.equipment.criticality)}
                                        </Badge>
                                    </Box>
                                </Stat>
                                <Stat>
                                    <StatLabel>Emplacement</StatLabel>
                                    <StatNumber fontSize="md">{ticket.equipment.emplacement}</StatNumber>
                                </Stat>
                                <Stat>
                                    <StatLabel>Série</StatLabel>
                                    <StatNumber fontSize="md">{ticket.equipment.series}</StatNumber>
                                </Stat>
                                <Stat>
                                    <StatLabel>Marque</StatLabel>
                                    <StatNumber fontSize="md">{ticket.equipment.marque}</StatNumber>
                                </Stat>
                            </SimpleGrid>
                        </>
                    )}


                </VStack>
            </Box>

            {/* ================================================= */}
            {/* FORMULAIRE DYNAMIQUE */}
            {/* ================================================= */}

            {isLoading ? (
                <Center py={10}>
                    <Spinner />
                </Center>
            ) : error ? (
                <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    Impossible de charger le formulaire d'intervention.
                </Alert>
            ) : (
                Array.isArray(dynamicForm) &&
                dynamicForm.map((section: any) => (
                    <Box
                        key={section.section_id}
                        bg="white"
                        p={6}
                        borderRadius="xl"
                        shadow="sm"
                        border="1px solid"
                        borderColor="gray.100"
                    >
                        <Text fontWeight="bold" mb={4} color="gray.800">
                            {section.section_title}
                        </Text>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            {section.fields?.map((field: any) => (
                                <Box key={field.id}>
                                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={1}>
                                        {field.label}
                                    </Text>
                                    <FieldRenderer ticketId={ticket.id} field={field} />
                                </Box>
                            ))}
                        </SimpleGrid>
                    </Box>
                ))
            )}
        </VStack>
    );
}