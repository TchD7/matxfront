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
} from 'react-icons/fi';
import { formatDateTime } from '../../utils/userUtils';
import type { User } from '../types/user.types';

interface TicketStatusDetailProps {
    ticket: {
        id: string | number;
        status: string;
        created_at: string;
        actual_duration?: number | null;
        estimated_duration?: number | null;
        is_late?: boolean | null;
        started_at?: string | null;
        is_breakdown?: boolean;
        late_duration_minutes?: number | null;
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
        planned_at?: string | null;
        ended_at?: string | null;
    };
}

const formatDuration = (minutes?: number | null) => {
    if (minutes === undefined || minutes === null || minutes === 0) {
        return "Non spécifiée";
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins > 0 ? mins + 'min' : ''}`;
    }
    return `${mins}min`;
};

const formatDelay = (minutes?: number | null) => {
    if (minutes == null || minutes <= 0) {
        return '0 min';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return [hours > 0 ? `${hours} h` : null, `${remainingMinutes} min`]
        .filter(Boolean)
        .join(' ');
};

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
                description: 'Le ticket est planifié et attend le démarrage.',
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

export default function TicketStatusDetail({
    ticket,
}: TicketStatusDetailProps) {

    // =========================================================
    // STATUS CONFIG
    // =========================================================

    const statusConfig = useMemo(
        () => getStatusConfig(ticket.status),
        [ticket.status]
    );

    const StatusIcon = statusConfig.icon as ComponentType;

    // =========================================================
    // DURATION
    // =========================================================

    const hasActualDuration =
        ticket.actual_duration !== null &&
        ticket.actual_duration !== undefined;

    const durationToDisplay = hasActualDuration
        ? ticket.actual_duration
        : ticket.estimated_duration;

    // =========================================================
    // LATE CALCULATIONS
    // =========================================================

    const normalizedStatus = ticket.status?.toLowerCase();

    const isLate =
        ticket.is_late === true &&
        !['completed', 'closed', 'draft'].includes(
            normalizedStatus
        );

    const showLateDuration =
        isLate &&
        Boolean(ticket.started_at);

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
            const response = await axios.get(
                `/api/v1/tickets/${ticket.id}/render/`
            );

            return response.data;
        },

        enabled: Boolean(ticket.id),
        staleTime: 1000 * 60 * 5,
    });

    // =========================================================
    // UI
    // =========================================================

    return (
        <VStack
            spacing={6}
            align="stretch"
            width="100%"
        >

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
                <VStack
                    align="stretch"
                    spacing={6}
                >

                    {/* HEADER */}

                    <HStack
                        justify="space-between"
                        align="flex-start"
                    >
                        <HStack
                            spacing={4}
                            align="flex-start"
                        >
                            <Box
                                p={3}
                                borderRadius="full"
                                bg={`${statusConfig.color}.50`}
                                color={`${statusConfig.color}.600`}
                            >
                                <Icon
                                    as={StatusIcon}
                                    fontSize="xl"
                                />
                            </Box>

                            <VStack
                                align="flex-start"
                                spacing={1}
                            >
                                <HStack
                                    spacing={2}
                                    flexWrap="wrap"
                                >
                                    <Text
                                        fontSize="lg"
                                        fontWeight="bold"
                                    >
                                        Statut :
                                        {' '}
                                        {statusConfig.label}
                                    </Text>

                                    {ticket.is_breakdown && (
                                        <Badge
                                            colorScheme="red"
                                        >
                                            Panne
                                        </Badge>
                                    )}

                                    {isLate && (
                                        <Badge
                                            colorScheme="orange"
                                        >
                                            En retard
                                        </Badge>
                                    )}

                                    {showLateDuration &&
                                        typeof ticket.late_duration_minutes ===
                                        'number' && (
                                            <Badge
                                                colorScheme="red"
                                            >
                                                Retard :
                                                {' '}
                                                {formatDelay(
                                                    ticket.late_duration_minutes
                                                )}
                                            </Badge>
                                        )}
                                </HStack>

                                <Text
                                    fontSize="sm"
                                    color="gray.600"
                                >
                                    {
                                        statusConfig.description
                                    }
                                </Text>
                            </VStack>
                        </HStack>

                        {ticket.priority && (
                            <Badge
                                colorScheme={getPriorityColor(
                                    ticket.priority
                                )}
                                px={3}
                                py={1}
                            >
                                Priorité :
                                {' '}
                                {ticket.priority}
                            </Badge>
                        )}
                    </HStack>

                    {/* PROGRESS */}

                    <Box>
                        <HStack
                            justify="space-between"
                            mb={2}
                        >
                            <Text
                                fontSize="sm"
                                fontWeight="medium"
                            >
                                Progression
                            </Text>

                            <Text
                                fontSize="sm"
                                color="gray.600"
                            >
                                {statusConfig.progress}%
                            </Text>
                        </HStack>

                        <Progress
                            value={statusConfig.progress}
                            colorScheme={getProgressColor(
                                statusConfig.progress
                            )}
                            size="lg"
                            borderRadius="full"
                        />
                    </Box>

                    {/* METRICS */}

                    <SimpleGrid
                        columns={{
                            base: 1,
                            md: 3,
                        }}
                        spacing={4}
                    >
                        <Stat>
                            <StatLabel>
                                Équipement
                            </StatLabel>

                            <StatNumber
                                fontSize="md"
                            >
                                {ticket.equipment?.name ??
                                    'N/A'}
                            </StatNumber>

                            <StatHelpText>
                                {ticket.equipment?.code ??
                                    'Aucun code'}
                            </StatHelpText>
                        </Stat>

                        <Stat>
                            <StatLabel>
                                Technicien
                            </StatLabel>

                            <StatNumber
                                fontSize="md"
                            >
                                {ticket.technician_name ??
                                    'Non assigné'}
                            </StatNumber>

                            <StatHelpText>
                                {ticket.intervention_type
                                    ?.name ??
                                    'Non défini'}
                            </StatHelpText>
                        </Stat>

                        <Stat>
                            <StatLabel>
                                Durée
                            </StatLabel>

                            <StatNumber
                                fontSize="md"
                            >
                                {formatDuration(
                                    durationToDisplay
                                )}
                            </StatNumber>

                            <StatHelpText>
                                {hasActualDuration
                                    ? 'Réelle'
                                    : 'Estimée'}
                            </StatHelpText>
                        </Stat>
                    </SimpleGrid>

                    {/* EQUIPMENT */}

                    {ticket.equipment && (
                        <>
                            <Divider />

                            <SimpleGrid
                                columns={{
                                    base: 1,
                                    md: 2,
                                    lg: 3,
                                }}
                                spacing={4}
                            >
                                <Stat>
                                    <StatLabel>
                                        Nom
                                    </StatLabel>

                                    <StatNumber
                                        fontSize="md"
                                    >
                                        {
                                            ticket
                                                .equipment
                                                .name
                                        }
                                    </StatNumber>
                                </Stat>

                                <Stat>
                                    <StatLabel>
                                        Code
                                    </StatLabel>

                                    <StatNumber
                                        fontSize="md"
                                    >
                                        {
                                            ticket
                                                .equipment
                                                .code
                                        }
                                    </StatNumber>
                                </Stat>

                                <Stat>
                                    <StatLabel>
                                        Criticité
                                    </StatLabel>

                                    <Box mt={2}>
                                        <Badge
                                            colorScheme={getCriticalityColor(
                                                ticket
                                                    .equipment
                                                    .criticality
                                            )}
                                        >
                                            {getCriticalityLabel(
                                                ticket
                                                    .equipment
                                                    .criticality
                                            )}
                                        </Badge>
                                    </Box>
                                </Stat>

                                <Stat>
                                    <StatLabel>
                                        Emplacement
                                    </StatLabel>

                                    <StatNumber
                                        fontSize="md"
                                    >
                                        {
                                            ticket
                                                .equipment
                                                .emplacement
                                        }
                                    </StatNumber>
                                </Stat>

                                <Stat>
                                    <StatLabel>
                                        Série
                                    </StatLabel>

                                    <StatNumber
                                        fontSize="md"
                                    >
                                        {
                                            ticket
                                                .equipment
                                                .series
                                        }
                                    </StatNumber>
                                </Stat>

                                <Stat>
                                    <StatLabel>
                                        Marque
                                    </StatLabel>

                                    <StatNumber
                                        fontSize="md"
                                    >
                                        {
                                            ticket
                                                .equipment
                                                .marque
                                        }
                                    </StatNumber>
                                </Stat>
                            </SimpleGrid>
                        </>
                    )}

                    {/* TIMELINE */}

                    {(ticket.planned_at ||
                        ticket.started_at ||
                        ticket.ended_at) && (
                            <>
                                <Divider />

                                <VStack
                                    align="stretch"
                                    spacing={3}
                                >
                                    {ticket.created_at && (
                                        <Text>
                                            Créé :
                                            {' '}
                                            {formatDateTime(
                                                ticket.created_at
                                            )}
                                        </Text>
                                    )}
                                    {ticket.planned_at && (
                                        <Text>
                                            Planifié :
                                            {' '}
                                            {formatDateTime(
                                                ticket.planned_at
                                            )}
                                        </Text>
                                    )}

                                    {ticket.started_at && (
                                        <Text>
                                            Démarré :
                                            {' '}
                                            {formatDateTime(
                                                ticket.started_at
                                            )}
                                        </Text>
                                    )}

                                    {ticket.ended_at && (
                                        <Text>
                                            Terminé :
                                            {' '}
                                            {formatDateTime(
                                                ticket.ended_at
                                            )}
                                        </Text>
                                    )}
                                </VStack>
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
                <Alert status="error">
                    <AlertIcon />
                    Impossible de charger le formulaire.
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
                    >
                        <Text
                            fontWeight="bold"
                            mb={4}
                        >
                            {section.section_title}
                        </Text>

                        <SimpleGrid
                            columns={{
                                base: 1,
                                md: 2,
                            }}
                            spacing={4}
                        >
                            {section.fields?.map(
                                (field: any) => (
                                    <Box
                                        key={field.id}
                                    >
                                        <Text
                                            fontSize="xs"
                                            fontWeight="bold"
                                            mb={1}
                                        >
                                            {
                                                field.label
                                            }
                                        </Text>

                                        <FieldRenderer
                                            ticketId={
                                                ticket.id
                                            }
                                            field={
                                                field
                                            }
                                        />
                                    </Box>
                                )
                            )}
                        </SimpleGrid>
                    </Box>
                ))
            )}
        </VStack>
    );
}