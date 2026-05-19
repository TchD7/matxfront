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
} from '@chakra-ui/react';

import { useState } from 'react';
import api from '../../api/apiClient';

// ================= TYPES =================
interface DowntimeLog {
    id: number;
    start_time: string;
    end_time: string;
    reason?: string;
    source?: string;
}

interface Ticket {
    id: string;
    downtime_logs?: DowntimeLog[];
}

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

    const [form, setForm] = useState({
        start_time: '',
        end_time: '',
        reason: '',
        source: 'manual',
    });

    // ================= ADD DOWNTIME =================
    const addDowntime = async () => {
        try {
            setLoading(true);

            await api.post(`/api/v1/tickets/${ticket.id}/downtime/`, {
                start_time: form.start_time,
                end_time: form.end_time,
                reason: form.reason,
                source: form.source,
            });

            toast({
                title: 'Temps d’arrêt enregistré',
                status: 'success',
            });

            setForm({
                start_time: '',
                end_time: '',
                reason: '',
                source: 'manual',
            });

            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur enregistrement downtime',
                description: err.response?.data?.detail,
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // ================= UI =================
    if (!ticket) {
        return (
            <Center py={10}>
                <Spinner />
            </Center>
        );
    }

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">

                {/* FORM */}
                <Box borderWidth="1px" p={4} borderRadius="lg">

                    <VStack spacing={3} align="stretch">

                        <HStack>
                            <Input
                                type="datetime-local"
                                value={form.start_time}
                                onChange={(e) =>
                                    setForm({ ...form, start_time: e.target.value })
                                }
                            />

                            <Input
                                type="datetime-local"
                                value={form.end_time}
                                onChange={(e) =>
                                    setForm({ ...form, end_time: e.target.value })
                                }
                            />
                        </HStack>

                        <Input
                            placeholder="Cause / description"
                            value={form.reason}
                            onChange={(e) =>
                                setForm({ ...form, reason: e.target.value })
                            }
                        />

                        <Select
                            value={form.source}
                            onChange={(e) =>
                                setForm({ ...form, source: e.target.value })
                            }
                        >
                            <option value="manual">Saisie manuelle</option>
                            <option value="auto">Automatique</option>
                        </Select>

                        <Button
                            colorScheme="red"
                            onClick={addDowntime}
                            isLoading={loading}
                            isDisabled={
                                !form.start_time || !form.end_time
                            }
                        >
                            Ajouter arrêt machine
                        </Button>

                    </VStack>

                </Box>

                {/* TABLE */}
                <Box borderWidth="1px" borderRadius="lg" overflow="hidden">

                    <Table size="sm">

                        <Thead bg="gray.50">
                            <Tr>
                                <Th>Début</Th>
                                <Th>Fin</Th>
                                <Th>Durée</Th>
                                <Th>Cause</Th>
                            </Tr>
                        </Thead>

                        <Tbody>
                            {ticket.downtime_logs?.length ? (
                                ticket.downtime_logs.map((d) => {
                                    const start = new Date(d.start_time);
                                    const end = new Date(d.end_time);
                                    const duration =
                                        (end.getTime() - start.getTime()) / 60000;

                                    return (
                                        <Tr key={d.id}>
                                            <Td fontSize="sm">
                                                {start.toLocaleString('fr-FR')}
                                            </Td>
                                            <Td fontSize="sm">
                                                {end.toLocaleString('fr-FR')}
                                            </Td>
                                            <Td fontWeight="bold">
                                                {duration.toFixed(0)} min
                                            </Td>
                                            <Td>{d.reason || '-'}</Td>
                                        </Tr>
                                    );
                                })
                            ) : (
                                <Tr>
                                    <Td colSpan={4}>
                                        <Text fontSize="sm" color="gray.500">
                                            Aucun arrêt enregistré
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