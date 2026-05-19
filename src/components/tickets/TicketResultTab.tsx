import {
    Box,
    VStack,
    Text,
    Select,
    Textarea,
    Switch,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Badge,
    useToast,
    Center,
    Spinner,
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import api from '../../api/apiClient';

// ================= TYPES =================
interface FailureReason {
    id: number;
    label: string;
}

interface TicketResult {
    result: 'ok' | 'nok';
    reason?: number | null;
    comment?: string;
    auto_followup?: boolean;
}

interface Ticket {
    id: string;
    result?: TicketResult;
    status: string;
}

// ================= COMPONENT =================
export default function TicketResultTab({
    ticket,
    onRefresh,
}: {
    ticket: Ticket;
    onRefresh: () => void;
}) {
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [reasons, setReasons] = useState<FailureReason[]>([]);

    const [form, setForm] = useState<TicketResult>({
        result: 'ok',
        reason: null,
        comment: '',
        auto_followup: true,
    });

    // ================= LOAD REASONS =================
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/api/v1/failure-reasons/');
                setReasons(res.data.results || res.data || []);
            } catch {
                toast({
                    title: 'Erreur chargement causes',
                    status: 'error',
                });
            }
        };

        load();
    }, []);

    // ================= SUBMIT RESULT =================
    const submitResult = async () => {
        try {
            setLoading(true);

            await api.post(`/api/v1/tickets/${ticket.id}/complete/`, {
                technician_id: ticket.result?.reason || null, // adapté backend DRF (voir note)
                result: form.result,
                reason: form.reason,
                comment: form.comment,
            });

            toast({
                title: 'Ticket clôturé avec succès',
                status: 'success',
            });

            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur clôture ticket',
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

    const isNok = form.result === 'nok';

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">

                {/* STATUS */}
                <HStack>
                    <Text fontWeight="bold">Statut actuel :</Text>
                    <Badge colorScheme="green">{ticket.status}</Badge>
                </HStack>

                {/* RESULT */}
                <FormControl>
                    <FormLabel>Résultat de l'intervention</FormLabel>
                    <Select
                        value={form.result}
                        onChange={(e) =>
                            setForm({ ...form, result: e.target.value as any })
                        }
                    >
                        <option value="ok">OK - Résolu</option>
                        <option value="nok">NOK - Non résolu</option>
                    </Select>
                </FormControl>

                {/* FAILURE REASON (ONLY IF NOK) */}
                {isNok && (
                    <FormControl isRequired>
                        <FormLabel>Cause de la panne</FormLabel>
                        <Select
                            placeholder="Sélectionner une cause"
                            value={form.reason || ''}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    reason: Number(e.target.value),
                                })
                            }
                        >
                            {reasons.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.label}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* COMMENT */}
                <FormControl>
                    <FormLabel>Commentaire technique</FormLabel>
                    <Textarea
                        value={form.comment}
                        onChange={(e) =>
                            setForm({ ...form, comment: e.target.value })
                        }
                        placeholder="Analyse, observations, actions réalisées..."
                    />
                </FormControl>

                {/* AUTO FOLLOWUP */}
                <HStack justify="space-between">
                    <Text>Créer un suivi automatique</Text>
                    <Switch
                        isChecked={form.auto_followup}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                auto_followup: e.target.checked,
                            })
                        }
                    />
                </HStack>

                {/* ACTION */}
                <Button
                    colorScheme="green"
                    onClick={submitResult}
                    isLoading={loading}
                >
                    Clôturer le ticket
                </Button>

            </VStack>
        </Box>
    );
}