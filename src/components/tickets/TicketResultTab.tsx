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

import { useEffect, useState } from 'react';
import { FiEdit2 } from 'react-icons/fi'; // Importation de l'icône Crayon
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
    result?: TicketResult | null; // Intégration du résultat existant
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

    // Mode édition : faux par défaut si un résultat existe déjà sur le ticket
    const [isEditing, setIsEditing] = useState(!ticket?.result);

    const [form, setForm] = useState<FormState>({
        result: 'ok',
        reason: null,
        comment: '',
        auto_followup: true,
    });

    // ================= SYNC FORM WITH TICKET DATA =================
    useEffect(() => {
        if (ticket?.result) {
            setForm({
                result: (ticket.result.result?.toLowerCase() === 'nok' ? 'nok' : 'ok'),
                reason: ticket.result.reason_id ?? null,
                comment: ticket.result.comment ?? '',
                auto_followup: ticket.result.auto_followup ?? true,
            });
            setIsEditing(false); // Masque les champs si un résultat existe déjà
        } else {
            setIsEditing(true);  // Mode édition actif si aucun résultat
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

            setIsEditing(false); // Repasse en mode affichage masqué
            onRefresh();
        } catch (err: any) {
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

    // Retrouver le label de la panne sélectionnée pour l'affichage en mode lecture seule
    const selectedReasonLabel = reasons.find(r => r.id === form.reason)?.label || `ID: ${form.reason}`;

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">

                {/* HEADLINE STATUT TICKET */}
                <HStack justify="space-between">
                    <HStack>
                        <Text fontWeight="bold">Statut du ticket :</Text>
                        <Badge colorScheme="purple" px={2} py={0.5} borderRadius="md">
                            {ticket.status}
                        </Badge>
                    </HStack>

                    {/* Bouton Crayon : Visible uniquement si on ne modifie pas déjà, et sans appel API immédiat */}
                    {!isEditing && (
                        <IconButton
                            icon={<FiEdit2 />}
                            aria-label="Modifier le résultat"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => setIsEditing(true)} // Changement d'état purement local
                        />
                    )}
                </HStack>

                <Divider />

                {/* ================= MODE 1 : VUE RÉSULTAT MASQUÉE (LECTURE SEULE) ================= */}
                {!isEditing && ticket.result && (
                    <VStack align="stretch" spacing={4} bg="gray.50" p={4} borderRadius="lg" borderWidth="1px">
                        <Heading size="xs" textTransform="uppercase" color="gray.500" letterSpacing="wider">
                            Résultat Enregistré
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

                {/* ================= MODE 2 : FORMULAIRE D'ÉDITION ACTIF ================= */}
                {isEditing && (
                    <VStack spacing={5} align="stretch" animation="fadeIn 0.2s ease-out">

                        {/* FORMULAIRE : CHOIX RESULTAT */}
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

                        {/* FORMULAIRE : CAUSE DE PANNE (SI NOK) */}
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

                        {/* FORMULAIRE : COMMENTAIRE */}
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

                        {/* FORMULAIRE : SWITCH SUIVI */}
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

                        {/* BUTTONS ACTIONS */}
                        <HStack spacing={4} pt={2}>
                            <Button
                                colorScheme="green"
                                flex={1}
                                onClick={submitResult}
                                isLoading={loading}
                            >
                                Enregistrer le résultat
                            </Button>

                            {/* Annuler l'édition locale et revenir au visuel masqué sans recharger l'API */}
                            {ticket.result && (
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
    );
}