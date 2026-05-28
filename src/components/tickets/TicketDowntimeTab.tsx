import {
    Box,
    VStack,
    HStack,
    Text,
    Input,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useToast,
    Spinner,
    Center,
    Select,
    FormControl,
    FormLabel,
} from '@chakra-ui/react';

import { useState, useEffect } from 'react';
import api from '../../api/apiClient';

// ================= TYPES =================
interface DowntimeLog {
    id: number;
    start_time: string;
    end_time: string | null;
    status: 'ONGOING' | 'CLOSED' | 'CANCELED';
    reason?: string;
    equipment: number | string | any;
}

interface Ticket {
    id: string;
    equipment?: number | string | any;
    downtime_logs?: DowntimeLog[];
}

// Helper pour obtenir la date du jour au format YYYY-MM-DD
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper pour formater la date et l'heure combinées en ISO (sans décalage destructif)
const combineDateAndTime = (dateStr: string, hoursStr: string, minutesStr: string) => {
    if (!dateStr) return '';
    const datetime = new Date(`${dateStr}T${hoursStr.padStart(2, '0')}:${minutesStr.padStart(2, '0')}:00`);
    return datetime.toISOString();
};

// ================= COMPONENT =================
export default function TicketDowntimeTab({
    ticket,
    onRefresh,
}: {
    ticket: Ticket;
    onRefresh: () => void;
}) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<DowntimeLog[]>(ticket?.downtime_logs || []);

    // Synchronisation locale des logs quand le ticket change ou se rafraîchit
    useEffect(() => {
        if (ticket?.downtime_logs) {
            setLogs(ticket.downtime_logs);
        }
    }, [ticket]);

    // ================= FORM STATE =================
    const [hasDowntime, setHasDowntime] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());

    const [startTime, setStartTime] = useState({ hours: '08', minutes: '00' });
    const [endTime, setEndTime] = useState({ hours: '17', minutes: '00' });

    const [status, setStatus] = useState<'ONGOING' | 'CLOSED' | 'CANCELED'>('CLOSED');
    const [reason, setReason] = useState('');

    const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    // ================= ADD DOWNTIME =================
    const addDowntime = async () => {
        if (!hasDowntime) return;

        // 1. Reconstitution des dates au format ISO string
        const startIso = combineDateAndTime(selectedDate, startTime.hours, startTime.minutes);
        const endIso = status === 'ONGOING' ? null : combineDateAndTime(selectedDate, endTime.hours, endTime.minutes);

        // 2. Validation intelligente : Éviter l'inversion des horaires
        if (status !== 'ONGOING' && startIso >= (endIso as string)) {
            toast({
                title: 'Incohérence horaire',
                description: "L'heure de fin doit être strictement supérieure à l'heure de début.",
                status: 'warning',
                position: 'top',
                isClosable: true,
            });
            return;
        }

        // 3. Validation intelligente : Anti-double enregistrement (vérification doublon local)
        const isDuplicate = logs.some(log => {
            const logStartIso = new Date(log.start_time).toISOString();
            const currentStartIso = new Date(startIso).toISOString();
            return logStartIso === currentStartIso && log.status === status;
        });

        if (isDuplicate) {
            toast({
                title: 'Enregistrement dupliqué bloqué',
                description: 'Un arrêt machine débutant exactement à la même heure existe déjà pour ce ticket.',
                status: 'error',
                position: 'top',
                isClosable: true,
            });
            return;
        }

        try {
            setLoading(true);

            // Extraction propre du UUID/ID de l'équipement
            const equipmentId = typeof ticket.equipment === 'object' && ticket.equipment !== null
                ? (ticket.equipment as any).id
                : ticket.equipment;

            const response = await api.post(`/api/v1/downtime-logs/`, {
                ticket: ticket.id,
                equipment: equipmentId,
                start_time: startIso,
                end_time: endIso,
                status: status,
                reason: reason,
            });

            toast({
                title: 'Arrêt machine enregistré',
                status: 'success',
                position: 'top',
            });

            // Mise à jour immédiate du tableau local avant même le retour du serveur parent
            if (response.data) {
                setLogs(prev => [response.data, ...prev]);
            }

            // Réinitialisation intelligente
            setStartTime({ hours: '08', minutes: '00' });
            setEndTime({ hours: '17', minutes: '00' });
            setReason('');

            // Notification au composant parent
            onRefresh();

        } catch (err: any) {
            toast({
                title: "Erreur lors de l'enregistrement",
                description: err.response?.data?.detail || "Vérifiez les données du formulaire ou vos droits d'accès.",
                status: 'error',
                position: 'top',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!ticket) {
        return (
            <Center py={10}>
                <Spinner size="xl" color="red.500" />
            </Center>
        );
    }

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">

                {/* FORMULAIRE D'AJOUT */}
                <Box borderWidth="1px" p={5} borderRadius="lg" bg="white" shadow="sm">
                    <VStack spacing={4} align="stretch">

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">Y a-t-il eu un arrêt machine ?</FormLabel>
                            <Select
                                value={hasDowntime ? "yes" : "no"}
                                onChange={(e) => setHasDowntime(e.target.value === "yes")}
                            >
                                <option value="yes">Oui, enregistrer un arrêt</option>
                                <option value="no">Non, aucun arrêt</option>
                            </Select>
                        </FormControl>

                        {hasDowntime && (
                            <>
                                {/* 1. CALENDRIER DE LA DATE (PLUGUÉ EN HAUT) */}
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Date de l'arrêt</FormLabel>
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">Statut de l'arrêt</FormLabel>
                                    <Select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                    >
                                        <option value="CLOSED">Terminé (Machine réparée)</option>
                                        <option value="ONGOING">En cours (Panne active)</option>
                                        <option value="CANCELED">Annulé</option>
                                    </Select>
                                </FormControl>

                                {/* 2. SÉLECTEURS TEMPS / HEURE / MINUTE (PLUGUÉS EN BAS) */}
                                <HStack spacing={4} widths="100%" align="stretch">
                                    <Box borderWidth="1px" p={3} borderRadius="md" bg="gray.50" flex={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>HEURE DE DÉBUT</Text>
                                        <HStack>
                                            <Select
                                                value={startTime.hours}
                                                onChange={(e) => setStartTime({ ...startTime, hours: e.target.value })}
                                                bg="white"
                                                size="sm"
                                            >
                                                {hoursArray.map(h => <option key={h} value={h}>{h} h</option>)}
                                            </Select>
                                            <Text>:</Text>
                                            <Select
                                                value={startTime.minutes}
                                                onChange={(e) => setStartTime({ ...startTime, minutes: e.target.value })}
                                                bg="white"
                                                size="sm"
                                            >
                                                {minutesArray.map(m => <option key={m} value={m}>{m} min</option>)}
                                            </Select>
                                        </HStack>
                                    </Box>

                                    {status !== 'ONGOING' && (
                                        <Box borderWidth="1px" p={3} borderRadius="md" bg="gray.50" flex={1}>
                                            <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>HEURE DE FIN</Text>
                                            <HStack>
                                                <Select
                                                    value={endTime.hours}
                                                    onChange={(e) => setEndTime({ ...endTime, hours: e.target.value })}
                                                    bg="white"
                                                    size="sm"
                                                >
                                                    {hoursArray.map(h => <option key={h} value={h}>{h} h</option>)}
                                                </Select>
                                                <Text>:</Text>
                                                <Select
                                                    value={endTime.minutes}
                                                    onChange={(e) => setEndTime({ ...endTime, minutes: e.target.value })}
                                                    bg="white"
                                                    size="sm"
                                                >
                                                    {minutesArray.map(m => <option key={m} value={m}>{m} min</option>)}
                                                </Select>
                                            </HStack>
                                        </Box>
                                    )}
                                </HStack>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">Cause de la panne</FormLabel>
                                    <Input
                                        placeholder="Ex: Surchauffe moteur, coupure différentiel, maintenance préventive..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </FormControl>

                                <Button
                                    colorScheme="red"
                                    onClick={addDowntime}
                                    isLoading={loading}
                                    isDisabled={loading || !selectedDate}
                                    mt={2}
                                >
                                    Ajouter l'arrêt machine
                                </Button>
                            </>
                        )}
                    </VStack>
                </Box>

                {/* TABLEAU DES ENREGISTREMENTS CORRIGÉ */}
                <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" shadow="sm">
                    <Table size="sm">
                        <Thead bg="gray.100">
                            <Tr>
                                <Th>Début</Th>
                                <Th>Fin</Th>
                                <Th>Durée</Th>
                                <Th>Cause / Raison</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {logs && logs.length > 0 ? (
                                logs.map((d) => {
                                    const start = new Date(d.start_time);
                                    const end = d.end_time ? new Date(d.end_time) : null;
                                    const duration = end
                                        ? (end.getTime() - start.getTime()) / 60000
                                        : null;

                                    return (
                                        <Tr key={d.id || d.start_time}>
                                            <Td fontSize="sm">
                                                {start.toLocaleString('fr-FR')}
                                            </Td>
                                            <Td fontSize="sm">
                                                {end ? end.toLocaleString('fr-FR') : <Text as="span" color="orange.500" fontWeight="bold">En cours</Text>}
                                            </Td>
                                            <Td fontWeight="bold">
                                                {duration !== null
                                                    ? `${duration.toFixed(0)} min`
                                                    : 'En cours'}
                                            </Td>
                                            <Td>{d.reason || '-'}</Td>
                                        </Tr>
                                    );
                                })
                            ) : (
                                <Tr>
                                    <Td colSpan={4} textAlign="center" py={6}>
                                        <Text fontSize="sm" color="gray.500">
                                            Aucun temps d'arrêt enregistré pour ce ticket.
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