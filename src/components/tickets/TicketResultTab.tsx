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
    IconButton,
    Heading,
    Divider,
} from '@chakra-ui/react';

import { useEffect, useState, useRef } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import api from '../../api/apiClient';

// ================= TYPES =================

interface FailureReason {
    id: number;
    label: string;
}

interface TicketResult {
    result?: string;
    comment?: string;
    reason_id?: number | null;
    auto_followup?: boolean;
}

interface Ticket {
    id: string;
    status: string;
    result?: TicketResult | null;
}

interface FormState {
    result: 'ok' | 'nok';
    reason: number | null;
    comment: string;
    auto_followup: boolean;
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

    // Mode édition
    const [isEditing, setIsEditing] = useState(!ticket?.result);

    // Verrou pour empêcher le useEffect de tout écraser pendant le rafraîchissement
    const isRefreshingRef = useRef(false);

    const [form, setForm] = useState<FormState>({
        result: 'ok',
        reason: null,
        comment: '',
        auto_followup: true,
    });

    // ================= SYNC FORM WITH TICKET DATA =================
    useEffect(() => {
        // CORRECTION : Si on est en train de rafraîchir et que le ticket reçu n'a pas encore de résultat,
        // on bloque l'exécution pour éviter que l'affichage ne disparaisse.
        if (isRefreshingRef.current && !ticket?.result) {
            return;
        }

        if (ticket?.result) {
            setForm({
                result: (ticket.result.result?.toLowerCase() === 'nok' ? 'nok' : 'ok'),
                reason: ticket.result.reason_id ?? null,
                comment: ticket.result.comment ?? '',
                auto_followup: ticket.result.auto_followup ?? true,
            });
            setIsEditing(false);
            isRefreshingRef.current = false; // Fin du rafraîchissement, les données réelles sont là
        } else {
            setIsEditing(true);
        }
    }, [ticket]);

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
    }, [toast]);

    // ================= SUBMIT RESULT =================
    const submitResult = async () => {
        try {
            setLoading(true);

            await api.post(
                `/api/v1/tickets/${ticket.id}/result/`,
                {
                    result: form.result,
                    reason_id: form.result === 'nok' ? form.reason : null,
                    comment: form.comment,
                    auto_followup: form.auto_followup,
                }
            );

            toast({
                title: 'Résultat enregistré',
                status: 'success',
            });

            isRefreshingRef.current = true;
            setIsEditing(false);

            onRefresh();
        } catch (err: any) {
            // Capturation propre du format DRF {"detail": "..."}
            toast({
                title: 'Erreur enregistrement résultat',
                description: err.response?.data?.detail || "Une erreur est survenue",
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // ================= UI CALCULATIONS =================
    if (!ticket) {
        return (
            <Center py={10}>
                <Spinner />
            </Center>
        );
    }

    const isNok = form.result === 'nok';
    const isClosed = ticket.status === 'closed'; // Gèle l'interface si archivé

    // On affiche la vue lecture seule si on n'est pas en train d'éditer OU si le ticket est clos
    const showReadOnlyView = (!isEditing && (ticket.result || isRefreshingRef.current)) || isClosed;

    const selectedReasonLabel = reasons.find(r => r.id === form.reason)?.label || `ID: ${form.reason}`;

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">

                {/* HEADLINE STATUT TICKET */}
                <HStack justify="space-between">
                    <HStack>
                        <Text fontWeight="bold">Statut du ticket :</Text>
                        <Badge colorScheme={isClosed ? "red" : "purple"} px={2} py={0.5} borderRadius="md">
                            {ticket.status}
                        </Badge>
                    </HStack>

                    {/* On cache le bouton d'édition SI le ticket est "closed" */}
                    {showReadOnlyView && !isClosed && (
                        <IconButton
                            icon={<FiEdit2 />}
                            aria-label="Modifier le résultat"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => {
                                isRefreshingRef.current = false;
                                setIsEditing(true);
                            }}
                        />
                    )}
                </HStack>

                <Divider />

                {/* ================= MODE 1 : VUE RÉSULTAT (LECTURE SEULE) ================= */}
                {showReadOnlyView && (
                    <VStack align="stretch" spacing={4} bg={isClosed ? "orange.50" : "gray.50"} p={4} borderRadius="lg" borderWidth="1px" borderColor={isClosed ? "orange.200" : "gray.200"}>
                        <Heading size="xs" textTransform="uppercase" color={isClosed ? "orange.700" : "gray.500"} letterSpacing="wider">
                            {isClosed ? "Résultat Verrouillé (Archivé)" : "Résultat Enregistré"}
                        </Heading>

                        <HStack>
                            <Text fontWeight="medium" w="120px">Évaluation :</Text>
                            <Badge colorScheme={form.result === 'ok' ? 'green' : 'red'} variant="solid" px={3}>
                                {form.result === 'ok' ? 'OK - RÉSOLU' : 'NOK - NON RÉSOLU'}
                            </Badge>
                        </HStack>

                        {form.result === 'nok' && form.reason && (
                            <HStack>
                                <Text fontWeight="medium" w="120px">Cause de panne :</Text>
                                <Text color="red.600" fontWeight="semibold">{selectedReasonLabel}</Text>
                            </HStack>
                        )}

                        <HStack align="top">
                            <Text fontWeight="medium" w="120px">Commentaire :</Text>
                            <Text color="gray.700" whiteSpace="pre-line">
                                {form.comment || 'Aucun commentaire fourni.'}
                            </Text>
                        </HStack>

                        <HStack>
                            <Text fontWeight="medium" w="120px">Suivi auto :</Text>
                            <Badge colorScheme={form.auto_followup ? 'teal' : 'gray'}>
                                {form.auto_followup ? 'Activé' : 'Désactivé'}
                            </Badge>
                        </HStack>
                    </VStack>
                )}

                {/* ================= MODE 2 : FORMULAIRE D'ÉDITION (Uniquement si NON closed) ================= */}
                {isEditing && !isClosed && (
                    <VStack spacing={5} align="stretch">
                        <FormControl>
                            <FormLabel fontWeight="semibold">Résultat</FormLabel>
                            <Select
                                value={form.result}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        result: e.target.value as 'ok' | 'nok',
                                    })
                                }
                            >
                                <option value="ok">OK - Résolu</option>
                                <option value="nok">NOK - Non résolu</option>
                            </Select>
                        </FormControl>

                        {isNok && (
                            <FormControl isRequired>
                                <FormLabel fontWeight="semibold">Cause de la panne</FormLabel>
                                <Select
                                    placeholder="Sélectionner une cause"
                                    value={form.reason || ''}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            reason: e.target.value ? Number(e.target.value) : null,
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

                        <FormControl>
                            <FormLabel fontWeight="semibold">Commentaire</FormLabel>
                            <Textarea
                                value={form.comment}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        comment: e.target.value,
                                    })
                                }
                                placeholder="Saisir vos observations de clôture..."
                                rows={4}
                            />
                        </FormControl>

                        <HStack justify="space-between" bg="gray.50" p={3} borderRadius="md">
                            <Box>
                                <Text fontWeight="medium">Suivi automatique</Text>
                                <Text fontSize="xs" color="gray.500">Générer un ticket de ré-intervention si requis</Text>
                            </Box>
                            <Switch
                                isChecked={form.auto_followup}
                                colorScheme="green"
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        auto_followup: e.target.checked,
                                    })
                                }
                            />
                        </HStack>

                        <HStack spacing={4} pt={2}>
                            <Button
                                colorScheme="green"
                                flex={1}
                                onClick={submitResult}
                                isLoading={loading}
                            >
                                Enregistrer le résultat
                            </Button>

                            {(ticket.result || isRefreshingRef.current) && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    isDisabled={loading}
                                >
                                    Annuler
                                </Button>
                            )}
                        </HStack>
                    </VStack>
                )}
            </VStack>
        </Box>
    )
};