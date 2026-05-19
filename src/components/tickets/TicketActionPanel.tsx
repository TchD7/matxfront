import {
    Box,
    Button,
    HStack,
    Select,
    Input,
    Text,
    VStack,
    useToast,
    Spinner,
    Divider,
} from '@chakra-ui/react';

import { useState, useEffect } from 'react';
import api from '../../api/apiClient';

// ================= TYPES =================
interface Technician {
    id: number;
    full_display?: string;
    username?: string;
}

interface Ticket {
    id: string;
    status: string;
    permissions?: {
        can_assign: boolean;
        can_start: boolean;
        can_complete: boolean;
        can_close: boolean;
        can_duplicate: boolean;
    };
}

// ================= COMPONENT =================
export default function TicketActionPanel({
    ticket,
    onRefresh,
}: {
    ticket: Ticket;
    onRefresh: () => void;
}) {
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [technicians, setTechnicians] = useState<Technician[]>([]);

    const [selectedTechnician, setSelectedTechnician] = useState<string>('');
    const [plannedAt, setPlannedAt] = useState<string>('');

    const [result, setResult] = useState<'ok' | 'nok' | ''>('');
    const [reason, setReason] = useState('');
    const [comment, setComment] = useState('');

    // ================= LOAD TECHNICIANS =================
    const fetchTechnicians = async () => {
        try {
            const res = await api.get('/api/v1/technicians/');
            setTechnicians(res.data.results || res.data || []);
        } catch {
            toast({
                title: 'Erreur chargement techniciens',
                status: 'error',
            });
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, []);

    // ================= ACTIONS =================

    const assignTicket = async () => {
        try {
            setLoading(true);

            await api.post(`/api/v1/tickets/${ticket.id}/assign/`, {
                technician_id: Number(selectedTechnician),
                planned_at: plannedAt,
            });

            toast({ title: 'Ticket assigné', status: 'success' });
            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur assignation',
                description: err.response?.data?.detail,
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const startTicket = async () => {
        try {
            setLoading(true);

            await api.post(`/api/v1/tickets/${ticket.id}/start/`, {
                technician_id: Number(selectedTechnician),
            });

            toast({ title: 'Ticket démarré', status: 'success' });
            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur start',
                description: err.response?.data?.detail,
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const completeTicket = async () => {
        try {
            setLoading(true);

            await api.post(`/api/v1/tickets/${ticket.id}/complete/`, {
                technician_id: Number(selectedTechnician),
                result,
                reason: reason ? Number(reason) : null,
                comment,
            });

            toast({ title: 'Ticket complété', status: 'success' });
            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur completion',
                description: err.response?.data?.detail,
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const closeTicket = async () => {
        try {
            setLoading(true);

            await api.post(`/api/v1/tickets/${ticket.id}/close/`);

            toast({ title: 'Ticket clôturé', status: 'success' });
            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur fermeture',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // ================= UI =================
    return (
        <Box p={4} bg="gray.50" borderRadius="lg">

            <Text fontWeight="bold" mb={3}>
                Actions du ticket
            </Text>

            <Divider mb={4} />

            {/* ASSIGNATION */}
            {ticket.permissions?.can_assign && (
                <VStack align="stretch" spacing={3} mb={5}>

                    <Text fontSize="sm" fontWeight="bold">
                        Assignation
                    </Text>

                    <Select
                        placeholder="Technicien"
                        value={selectedTechnician}
                        onChange={(e) => setSelectedTechnician(e.target.value)}
                    >
                        {technicians.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.full_display || t.username}
                            </option>
                        ))}
                    </Select>

                    <Input
                        type="datetime-local"
                        value={plannedAt}
                        onChange={(e) => setPlannedAt(e.target.value)}
                    />

                    <Button
                        colorScheme="purple"
                        onClick={assignTicket}
                        isLoading={loading}
                        isDisabled={!selectedTechnician || !plannedAt}
                    >
                        Assigner
                    </Button>
                </VStack>
            )}

            {/* START */}
            {ticket.permissions?.can_start && (
                <Button
                    colorScheme="blue"
                    onClick={startTicket}
                    isLoading={loading}
                    w="full"
                    mb={3}
                >
                    Démarrer intervention
                </Button>
            )}

            {/* COMPLETE */}
            {ticket.permissions?.can_complete && (
                <VStack align="stretch" spacing={3} mb={5}>

                    <Text fontSize="sm" fontWeight="bold">
                        Finalisation
                    </Text>

                    <Select
                        placeholder="Résultat"
                        value={result}
                        onChange={(e) => setResult(e.target.value as any)}
                    >
                        <option value="ok">OK</option>
                        <option value="nok">NOK</option>
                    </Select>

                    {result === 'nok' && (
                        <Input
                            placeholder="Reason ID"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    )}

                    <Input
                        placeholder="Commentaire"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <Button
                        colorScheme="green"
                        onClick={completeTicket}
                        isLoading={loading}
                        isDisabled={!result}
                    >
                        Terminer
                    </Button>
                </VStack>
            )}

            {/* CLOSE */}
            {ticket.permissions?.can_close && (
                <Button
                    colorScheme="orange"
                    onClick={closeTicket}
                    isLoading={loading}
                    w="full"
                >
                    Clôturer
                </Button>
            )}

            {loading && (
                <HStack mt={3}>
                    <Spinner size="sm" />
                    <Text fontSize="sm">Traitement...</Text>
                </HStack>
            )}

        </Box>
    );
}