import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Progress,
    Icon,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Divider,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';

import { ComponentType } from 'react';

import {
    FiClock,
    FiCheckCircle,
    FiAlertTriangle,
    FiPlay,
    FiPause,
    FiXCircle,
    FiUser,
    FiCalendar,
    FiTool,
} from 'react-icons/fi';

// ================= TYPES =================
interface Ticket {
    id: string;
    number?: string;
    status: string;

    equipment?: {
        id?: string;
        name?: string;
        emplacement?: string;
        series?: string;
        marque?: string;
        code?: string;
        criticality?: string;
        nominal_cycle_time?: number;
    };

    intervention_type?: {
        name?: string;
    };

    technician_name?: string | null;

    planned_at?: string;
    started_at?: string;
    ended_at?: string;

    is_breakdown?: boolean;
    is_late?: boolean;

    priority?: string;

    estimated_duration?: number;
    actual_duration?: number | null;
}

// ================= STATUS CONFIG =================
const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'open':
            return {
                label: 'Ouvert',
                color: 'gray',
                progress: 10,
                description: 'Ticket créé et en attente de traitement',
                icon: FiPause,
                actions: ['Assigner', 'Planifier'],
            };

        case 'planned':
            return {
                label: 'Planifié',
                color: 'purple',
                progress: 25,
                description: 'Intervention planifiée',
                icon: FiCalendar,
                actions: ['Démarrer', 'Modifier'],
            };

        case 'in_progress':
            return {
                label: 'En cours',
                color: 'blue',
                progress: 60,
                description: 'Intervention en cours',
                icon: FiPlay,
                actions: ['Suspendre', 'Terminer'],
            };

        case 'paused':
            return {
                label: 'En pause',
                color: 'orange',
                progress: 50,
                description: 'Intervention temporairement suspendue',
                icon: FiPause,
                actions: ['Reprendre', 'Annuler'],
            };

        case 'completed':
            return {
                label: 'Terminé',
                color: 'green',
                progress: 100,
                description: 'Intervention terminée',
                icon: FiCheckCircle,
                actions: [],
            };

        case 'closed':
            return {
                label: 'Clôturé',
                color: 'teal', // 🟢 Correction : 'solid' n'est pas une couleur Chakra UI, remplacé par 'teal'
                progress: 100,
                description: 'Ticket archivé et clôturé',
                icon: FiCheckCircle,
                actions: [],
            };

        case 'cancelled':
            return {
                label: 'Annulé',
                color: 'red',
                progress: 0,
                description: 'Ticket annulé',
                icon: FiXCircle,
                actions: [],
            };

        default:
            return {
                label: status || 'Inconnu',
                color: 'gray',
                progress: 0,
                description: 'Statut inconnu',
                icon: FiAlertTriangle,
                actions: [],
            };
    }
};

// ================= CRITICALITY =================
const getCriticalityColor = (criticality?: string) => {
    switch (criticality?.toLowerCase()) {
        case 'critical':
        case 'high':
            return 'red';
        case 'medium':
            return 'orange';
        case 'low':
            return 'green';
        default:
            return 'gray';
    }
};

const getCriticalityLabel = (criticality?: string) => {
    switch (criticality?.toLowerCase()) {
        case 'critical': return 'Critique';
        case 'high': return 'Haute';
        case 'medium': return 'Moyenne';
        case 'low': return 'Faible';
        default: return 'Non définie';
    }
};

// ================= COMPONENT =================
interface TicketStatusDetailProps {
    ticket: Ticket;
}

export default function TicketStatusDetail({ ticket }: TicketStatusDetailProps) {
    const statusConfig = getStatusConfig(ticket.status);
    console.log("Données du ticket reçues :", ticket);

    const StatusIcon = statusConfig.icon as ComponentType;

    // ================= HELPERS =================
    const getProgressColor = () => {
        if (statusConfig.progress >= 100) return 'green';
        if (statusConfig.progress >= 70) return 'blue';
        if (statusConfig.progress >= 30) return 'purple';
        return 'gray';
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'urgent':
                return 'red';
            case 'medium':
            case 'normal':
                return 'orange';
            case 'low':
                return 'green';
            default:
                return 'gray';
        }
    };
    const formatDate = (date?: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('fr-FR', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };
    // 1. Modifie la fonction de formatage pour gérer le cas où c'est vide
    const formatDuration = (minutes?: number | null) => {
        if (minutes === undefined || minutes === null || minutes === 0) {
            return "Non spécifiée"; // Évite le "N/A" si le champ est null en base
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins > 0 ? mins + 'min' : ''}`;
        }
        return `${mins}min`;
    };

    // 2. On cible directement ton champ Django 'estimated_duration'
    const durationToDisplay = ticket.estimated_duration;

    const hasActualDuration = ticket.actual_duration !== undefined && ticket.actual_duration !== null;


    return (
        <Box
            bg="white"
            borderRadius="xl"
            p={6}
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
        >
            <VStack align="stretch" spacing={6}>
                {/* HEADER */}
                <HStack justify="space-between" align="flex-start">
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
                                        <HStack spacing={1}>
                                            <Icon as={FiAlertTriangle} boxSize={3} />
                                            <Text fontSize="xs">Panne</Text>
                                        </HStack>
                                    </Badge>
                                )}

                                {ticket.is_late &&
                                    ticket.status !== 'completed' &&
                                    ticket.status !== 'closed' && (
                                        <Badge colorScheme="orange" variant="outline">
                                            En retard
                                        </Badge>
                                    )}
                            </HStack>

                            <Text color="gray.600" fontSize="sm">
                                {statusConfig.description}
                            </Text>
                        </VStack>
                    </HStack>

                    {ticket.priority && (
                        <Badge
                            colorScheme={getPriorityColor(ticket.priority)}
                            variant="solid"
                            fontSize="xs"
                            px={3}
                            py={1}
                        >
                            Priorité : {ticket.priority}
                        </Badge>
                    )}
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
                        colorScheme={getProgressColor()}
                        borderRadius="full"
                        size="lg"
                    />
                </Box>

                {/* METRICS */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Stat>
                        <StatLabel fontSize="sm" color="gray.600">
                            <HStack spacing={1}>
                                <Icon as={FiTool} />
                                <Text>Équipement</Text>
                            </HStack>
                        </StatLabel>
                        <StatNumber fontSize="md" noOfLines={1}>
                            {ticket.equipment?.name || 'N/A'}
                        </StatNumber>
                        <StatHelpText fontSize="xs">
                            {ticket.equipment?.code || 'Aucun code'}
                        </StatHelpText>
                    </Stat>

                    <Stat>
                        <StatLabel fontSize="sm" color="gray.600">
                            <HStack spacing={1}>
                                <Icon as={FiUser} />
                                <Text>Technicien</Text>
                            </HStack>
                        </StatLabel>
                        <StatNumber
                            fontSize="md"
                            color={ticket.technician_name ? 'black' : 'gray.400'}
                        >
                            {ticket.technician_name || 'Non assigné'}
                        </StatNumber>
                        <StatHelpText fontSize="xs">
                            {ticket.intervention_type?.name || 'Type non défini'}
                        </StatHelpText>
                    </Stat>

                    <Stat>
                        <StatLabel fontSize="sm" color="gray.600">
                            <HStack spacing={1}>
                                <Icon as={FiClock} />
                                <Text>Durée</Text>
                            </HStack>
                        </StatLabel>
                        <StatNumber fontSize="md">
                            {formatDuration(durationToDisplay)}
                        </StatNumber>
                        <StatHelpText fontSize="xs">
                            {hasActualDuration ? 'Réelle' : 'Estimée'}
                        </StatHelpText>
                    </Stat>
                </SimpleGrid>

                <Divider />

                {/* EQUIPMENT DETAILS */}
                {ticket.equipment && (
                    <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={3}>
                            Détails de l'équipement
                        </Text>

                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                            <Stat>
                                <StatLabel>Nom</StatLabel>
                                <StatNumber fontSize="md">
                                    {ticket.equipment.name || 'N/A'}
                                </StatNumber>
                            </Stat>

                            <Stat>
                                <StatLabel>Code</StatLabel>
                                <StatNumber fontSize="md">
                                    {ticket.equipment.code || 'N/A'}
                                </StatNumber>
                            </Stat>

                            <Stat>
                                <StatLabel>Criticité</StatLabel>
                                <Box mt={2}>
                                    <Badge
                                        colorScheme={getCriticalityColor(
                                            ticket.equipment.criticality
                                        )}
                                    >
                                        {getCriticalityLabel(ticket.equipment.criticality)}
                                    </Badge>
                                </Box>
                            </Stat>

                            <Stat>
                                <StatLabel>Emplacement</StatLabel>
                                <StatNumber fontSize="md">
                                    {ticket.equipment.emplacement || 'N/A'}
                                </StatNumber>
                            </Stat>

                            <Stat>
                                <StatLabel>Série</StatLabel>
                                <StatNumber fontSize="md">
                                    {ticket.equipment.series || 'N/A'}
                                </StatNumber>
                            </Stat>

                            <Stat>
                                <StatLabel>Marque</StatLabel>
                                <StatNumber fontSize="md">
                                    {ticket.equipment.marque || 'N/A'}
                                </StatNumber>
                            </Stat>

                            {ticket.equipment.nominal_cycle_time !== undefined && (
                                <Stat>
                                    <StatLabel>Temps cycle nominal</StatLabel>
                                    <StatNumber fontSize="md">
                                        {ticket.equipment.nominal_cycle_time}s
                                    </StatNumber>
                                    <StatHelpText fontSize="xs">par pièce</StatHelpText>
                                </Stat>
                            )}
                        </SimpleGrid>
                    </Box>
                )}

                <Divider />

                {/* TIMELINE */}
                <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={3}>
                        Chronologie
                    </Text>

                    <VStack align="stretch" spacing={3}>
                        {ticket.planned_at && (
                            <HStack>
                                <Icon as={FiCalendar} color="purple.500" />
                                <Text fontSize="sm">
                                    Planifié : {formatDate(ticket.planned_at)}
                                </Text>
                            </HStack>
                        )}

                        {ticket.started_at && (
                            <HStack>
                                <Icon as={FiPlay} color="blue.500" />
                                <Text fontSize="sm">
                                    Démarré : {formatDate(ticket.started_at)}
                                </Text>
                            </HStack>
                        )}

                        {ticket.ended_at && (
                            <HStack>
                                <Icon as={FiCheckCircle} color="green.500" />
                                <Text fontSize="sm">
                                    Terminé : {formatDate(ticket.ended_at)}
                                </Text>
                            </HStack>
                        )}
                    </VStack>
                </Box>

                {/* ACTIONS */}
                {statusConfig.actions.length > 0 && (
                    <Alert status="info" borderRadius="lg">
                        <AlertIcon />
                        <Box>
                            <AlertTitle fontSize="sm">Actions disponibles</AlertTitle>
                            <AlertDescription fontSize="sm">
                                {statusConfig.actions.join(' • ')}
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}
            </VStack>
        </Box>
    );
}