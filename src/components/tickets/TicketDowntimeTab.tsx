import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Badge,
    Box,
    Button,
    Center,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    Spinner,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useToast,
    VStack,
} from '@chakra-ui/react';

import { useEffect, useMemo, useState } from 'react';
import api from '../../api/apiClient';

// ============================================================
// TYPES
// ============================================================

type DowntimeStatus = 'ONGOING' | 'CLOSED' | 'CANCELED';

interface DowntimeLog {
    id: number;
    equipment: number;
    ticket: number | null;
    status: DowntimeStatus;
    start_time: string;
    end_time: string | null;
    reason: string;
    duration_seconds: number;
    version: number;
}

interface Ticket {
    id: number;
    equipment?: number | { id: number };
    downtime_logs?: DowntimeLog[];
}

// ============================================================
// HELPERS
// ============================================================

const getNowDate = () => new Date().toISOString().split('T')[0];

const getNowTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
    ).padStart(2, '0')}`;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
};

const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) {
        return 'En cours';
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} j`);
    if (hours > 0) parts.push(`${hours} h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} min`);

    return parts.join(' ');
};

// ============================================================
// COMPONENT
// ============================================================

export default function TicketDowntimeTab({
    ticket,
    onRefresh,
}: {
    ticket: Ticket;
    onRefresh: () => void;
}) {
    const toast = useToast();

    // ============================================================
    // STATES
    // ============================================================

    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<DowntimeLog[]>(ticket?.downtime_logs || []);

    // États pour la création
    const [startDate, setStartDate] = useState(getNowDate());
    const [startTime, setStartTime] = useState(getNowTime());

    // États pour la clôture (gèrent maintenant les pannes de plusieurs jours)
    const [endDate, setEndDate] = useState(getNowDate());
    const [endTime, setEndTime] = useState(getNowTime());

    // États distincts pour éviter les conflits entre formulaires
    const [createReason, setCreateReason] = useState('');
    const [closeReason, setCloseReason] = useState('');

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showResolveForm, setShowResolveForm] = useState(false);

    // ============================================================
    // MEMO
    // ============================================================

    const ongoingLog = useMemo(() => {
        return logs.find((log) => log.status === 'ONGOING');
    }, [logs]);

    // ============================================================
    // EFFECTS
    // ============================================================

    useEffect(() => {
        if (ticket?.downtime_logs) {
            const sortedLogs = [...ticket.downtime_logs].sort(
                (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
            );
            setLogs(sortedLogs);
        }
    }, [ticket]);

    useEffect(() => {
        if (!ongoingLog) {
            setShowResolveForm(false);
        }
    }, [ongoingLog]);

    // ============================================================
    // HELPERS
    // ============================================================

    const getEquipmentId = () => {
        if (typeof ticket.equipment === 'object' && ticket.equipment !== null) {
            return ticket.equipment.id;
        }
        return ticket.equipment;
    };

    const showError = (err: any, fallback: string) => {
        const data = err?.response?.data;
        let description =
            data?.detail ||
            data?.equipment?.[0] ||
            data?.end_time?.[0] ||
            data?.start_time?.[0] ||
            fallback;

        toast({
            title: 'Erreur',
            description,
            status: 'error',
            position: 'top',
            isClosable: true,
        });
    };

    // ============================================================
    // CREATE DOWNTIME
    // ============================================================

    const handleStartDowntime = async () => {
        try {
            setLoading(true);
            const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();

            const response = await api.post('/api/v1/downtime-logs/', {
                equipment: getEquipmentId(),
                ticket: ticket.id,
                status: 'ONGOING',
                start_time: startIso,
                reason: createReason || '',
            });

            setLogs((prev) => [response.data, ...prev]);
            setCreateReason('');
            setShowCreateForm(false);

            toast({
                title: 'Downtime démarré',
                status: 'warning',
                position: 'top',
                isClosable: true,
            });

            onRefresh();
        } catch (err: any) {
            showError(err, "Impossible d'enregistrer le downtime.");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // CLOSE DOWNTIME
    // ============================================================

    const handleCloseDowntime = async () => {
        if (!ongoingLog) return;

        try {
            setLoading(true);
            // Construit la date de fin exacte sélectionnée dans l'interface
            const endIso = new Date(`${endDate}T${endTime}:00`).toISOString();

            const response = await api.patch(`/api/v1/downtime-logs/${ongoingLog.id}/`, {
                status: 'CLOSED',
                end_time: endIso,
                reason: closeReason || ongoingLog.reason,
                version: ongoingLog.version,
            });

            setLogs((prev) =>
                prev.map((log) => (log.id === ongoingLog.id ? response.data : log))
            );

            setCloseReason('');
            setShowResolveForm(false);

            toast({
                title: 'Downtime clôturé',
                status: 'success',
                position: 'top',
                isClosable: true,
            });

            onRefresh();
        } catch (err: any) {
            showError(err, 'Impossible de clôturer le downtime.');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // CANCEL DOWNTIME
    // ============================================================

    const handleCancelDowntime = async () => {
        if (!ongoingLog) return;

        try {
            setLoading(true);
            const response = await api.patch(`/api/v1/downtime-logs/${ongoingLog.id}/`, {
                status: 'CANCELED',
                end_time: new Date().toISOString(),
                version: ongoingLog.version,
            });

            setLogs((prev) =>
                prev.map((log) => (log.id === ongoingLog.id ? response.data : log))
            );

            toast({
                title: 'Downtime annulé',
                status: 'info',
                position: 'top',
                isClosable: true,
            });

            onRefresh();
        } catch (err: any) {
            showError(err, "Impossible d'annuler le downtime.");
        } finally {
            setLoading(false);
        }
    };

    if (!ticket) {
        return (
            <Center py={10}>
                <Spinner size="xl" thickness="4px" color="blue.500" />
            </Center>
        );
    }

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">
                {/* CONTROL PANEL */}
                <Box bg="white" borderWidth="1px" borderRadius="xl" p={5} shadow="sm">
                    <VStack align="stretch" spacing={5}>
                        <Heading size="sm" color="gray.700">
                            Gestion du downtime machine
                        </Heading>

                        {!ongoingLog ? (
                            <VStack align="stretch" spacing={4}>
                                {!showCreateForm ? (
                                    <Button
                                        colorScheme="orange"
                                        size="lg"
                                        onClick={() => {
                                            setStartDate(getNowDate());
                                            setStartTime(getNowTime());
                                            setShowCreateForm(true);
                                        }}
                                    >
                                        Déclarer un arrêt machine
                                    </Button>
                                ) : (
                                    <VStack
                                        align="stretch"
                                        spacing={4}
                                        p={4}
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        bg="orange.50"
                                        borderColor="orange.200"
                                    >
                                        <Text fontWeight="bold" fontSize="sm" color="orange.700">
                                            Début du downtime
                                        </Text>

                                        <HStack spacing={4}>
                                            <FormControl isRequired>
                                                <FormLabel fontSize="xs">Date</FormLabel>
                                                <Input
                                                    type="date"
                                                    bg="white"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </FormControl>

                                            <FormControl isRequired>
                                                <FormLabel fontSize="xs">Heure</FormLabel>
                                                <Input
                                                    type="time"
                                                    bg="white"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                />
                                            </FormControl>
                                        </HStack>

                                        <FormControl>
                                            <FormLabel fontSize="xs">Cause initiale</FormLabel>
                                            <Input
                                                bg="white"
                                                placeholder="Ex: Surchauffe, coupure, bourrage..."
                                                value={createReason}
                                                onChange={(e) => setCreateReason(e.target.value)}
                                            />
                                        </FormControl>

                                        <HStack justify="flex-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setShowCreateForm(false)}
                                            >
                                                Retour
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorScheme="orange"
                                                isLoading={loading}
                                                onClick={handleStartDowntime}
                                            >
                                                Démarrer le downtime
                                            </Button>
                                        </HStack>
                                    </VStack>
                                )}
                            </VStack>
                        ) : (
                            <VStack align="stretch" spacing={4}>
                                <Alert status="warning" borderRadius="lg" variant="subtle">
                                    <AlertIcon />
                                    <Box flex="1">
                                        <AlertTitle>Downtime actif</AlertTitle>
                                        <AlertDescription fontSize="sm">
                                            Début : {formatDateTime(ongoingLog.start_time)}
                                        </AlertDescription>
                                    </Box>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        colorScheme="gray"
                                        isLoading={loading}
                                        onClick={handleCancelDowntime}
                                    >
                                        Annuler
                                    </Button>
                                </Alert>

                                {!showResolveForm ? (
                                    <Button
                                        colorScheme="green"
                                        size="lg"
                                        onClick={() => {
                                            setEndDate(getNowDate());
                                            setEndTime(getNowTime());
                                            setCloseReason(ongoingLog.reason || '');
                                            setShowResolveForm(true);
                                        }}
                                    >
                                        Signaler la remise en marche
                                    </Button>
                                ) : (
                                    <VStack
                                        align="stretch"
                                        spacing={4}
                                        p={4}
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        bg="green.50"
                                        borderColor="green.200"
                                    >
                                        <Text fontWeight="bold" fontSize="sm" color="green.700">
                                            Clôture du downtime
                                        </Text>

                                        {/* Modifié pour permettre le choix de la date de clôture */}
                                        <HStack spacing={4}>
                                            <FormControl isRequired>
                                                <FormLabel fontSize="xs">Date de redémarrage</FormLabel>
                                                <Input
                                                    type="date"
                                                    bg="white"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </FormControl>

                                            <FormControl isRequired>
                                                <FormLabel fontSize="xs">Heure de redémarrage</FormLabel>
                                                <Input
                                                    type="time"
                                                    bg="white"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                />
                                            </FormControl>
                                        </HStack>

                                        <FormControl>
                                            <FormLabel fontSize="xs">Cause / diagnostic final</FormLabel>
                                            <Input
                                                bg="white"
                                                placeholder="Ex: moteur remplacé, réarmement thermique..."
                                                value={closeReason}
                                                onChange={(e) => setCloseReason(e.target.value)}
                                            />
                                        </FormControl>

                                        <HStack justify="flex-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setShowResolveForm(false)}
                                            >
                                                Retour
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorScheme="green"
                                                isLoading={loading}
                                                onClick={handleCloseDowntime}
                                            >
                                                Clôturer
                                            </Button>
                                        </HStack>
                                    </VStack>
                                )}
                            </VStack>
                        )}
                    </VStack>
                </Box>

                {/* HISTORY */}
                <Box bg="white" borderWidth="1px" borderRadius="xl" overflow="hidden" shadow="sm">
                    <Table size="md">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>Début</Th>
                                <Th>Fin</Th>
                                <Th>Durée</Th>
                                <Th>Statut</Th>
                                <Th>Cause</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <Tr key={log.id} _hover={{ bg: 'gray.50' }}>
                                        <Td fontSize="sm">{formatDateTime(log.start_time)}</Td>
                                        <Td fontSize="sm">{formatDateTime(log.end_time)}</Td>
                                        <Td fontWeight="semibold" color="gray.700">
                                            {formatDuration(log.duration_seconds)}
                                        </Td>
                                        <Td>
                                            <Badge
                                                borderRadius="md"
                                                variant="subtle"
                                                colorScheme={
                                                    log.status === 'CLOSED'
                                                        ? 'green'
                                                        : log.status === 'ONGOING'
                                                            ? 'orange'
                                                            : 'gray'
                                                }
                                            >
                                                {log.status === 'ONGOING'
                                                    ? 'En cours'
                                                    : log.status === 'CLOSED'
                                                        ? 'Clôturé'
                                                        : 'Annulé'}
                                            </Badge>
                                        </Td>
                                        <Td maxW="250px" fontSize="sm" color="gray.600">
                                            {log.reason || (
                                                <Text as="span" color="gray.400" fontStyle="italic">
                                                    Aucune raison
                                                </Text>
                                            )}
                                        </Td>
                                    </Tr>
                                ))
                            ) : (
                                <Tr>
                                    <Td colSpan={5} textAlign="center" py={8}>
                                        <Text fontSize="sm" color="gray.400">
                                            Aucun downtime enregistré.
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