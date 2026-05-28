import {
    Box,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Spinner,
    Center,
    VStack,
    Text,
    useToast,
    Skeleton,
    SkeletonText,
} from '@chakra-ui/react';

import { useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../api/apiClient';

// Components
import TicketHeader from '../components/tickets/TicketHeader';
import TicketStatusDetail from '../components/tickets/TicketStatusDetail';
import TicketPlanningForm from '../components/tickets/TicketPlanningForm';
import TicketLogsTab from '../components/tickets/TicketLogsTab';
import TicketFieldsTab from '../components/tickets/TicketFieldsTab';
import TicketConsumablesTab from '../components/tickets/TicketConsumablesTab';
import TicketResultTab from '../components/tickets/TicketResultTab';
import TicketDowntimeTab from '../components/tickets/TicketDowntimeTab';

// Services
import {
    startTicket,
    assignTicket,
    completeTicket,
    closeTicket,
    deleteTicket,
} from '../services/ticketActions';

// Auth
import { useAuth } from '../context/AuthContext';


// ======================================================
// TYPES
// ======================================================

interface Equipment {
    id: number;
    name: string;
    code?: string;
}

interface InterventionType {
    id: number;
    name: string;
    color?: string;
}

interface TicketLog {
    id: number;
    action: string;
    created_at: string;
    created_by_name?: string;
    message?: string;
}

interface ConsumableUsage {
    id: number;
    quantity: number;
    consumable_name: string;
}

interface TicketResult {
    result?: string;
    comment?: string;
    completed_at?: string;
}

interface TicketPermissions {
    can_start?: boolean;
    can_assign?: boolean;
    can_complete?: boolean;
    can_close?: boolean;
    can_delete?: boolean;
    can_unassign?: boolean;
    can_duplicate?: boolean;
}

interface TicketUI {
    show_planning?: boolean;
    show_advanced_tabs?: boolean;
}

interface Ticket {
    id: string;
    number?: string;
    status: string;
    technician_name?: string | null;
    equipment?: Equipment | null;
    intervention_type?: InterventionType | null;
    logs?: TicketLog[];
    consumables?: ConsumableUsage[];
    result?: TicketResult | null;
    permissions?: TicketPermissions;
    ui?: TicketUI;
}

interface TicketDetailPageProps {
    ticketId?: string | number | null;
    onBack?: () => void;
}


// ======================================================
// COMPONENT
// ======================================================

export default function TicketDetailPage({
    ticketId,
    onBack,
}: TicketDetailPageProps) {

    // 🟢 1. TOUS LES HOOKS INITIALISÉS EN PREMIER SANS INTERRUPTION
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const effectiveTicketId = ticketId ?? id;

    // ======================================================
    // FETCH (Définition stable de la fonction de requête)
    // ======================================================
    const fetchTicket = useCallback(async (): Promise<Ticket> => {
        if (!effectiveTicketId) throw new Error("ID du ticket manquant");
        const response = await api.get(
            `/api/v1/tickets/${effectiveTicketId}/`
        );
        return response.data;
    }, [effectiveTicketId]);

    // UseQuery appelé de manière inconditionnelle
    const {
        data: ticket,
        isLoading,
        isFetching,
        refetch,
    } = useQuery<Ticket>({
        queryKey: ['ticket', effectiveTicketId],
        queryFn: fetchTicket,
        enabled: !!effectiveTicketId, // Ne s'exécute que si un ID est présent
        staleTime: 1000 * 20,
        refetchOnWindowFocus: true,
    });

    // ======================================================
    // GLOBAL ACTION MUTATION
    // ======================================================
    const actionMutation = useMutation({
        mutationFn: async ({
            action,
            payload,
        }: {
            action: string;
            payload?: any;
        }) => {
            if (!ticket) return;

            const actionHandlers: Record<string, () => Promise<any>> = {
                start: async () => {
                    return startTicket(ticket.id, {
                        technician_id: user?.id || 1,
                    });
                },
                assign: async () => {
                    return assignTicket(ticket.id, {
                        technician_id: payload?.technician_id || user?.id || 1,
                        planned_at: payload?.planned_at || new Date().toISOString(),
                    });
                },
                complete: async () => {
                    return completeTicket(ticket.id, {
                        technician_id: user?.id || 1,
                        result: payload?.result || 'ok',
                        comment: payload?.comment || 'Clôture intervention',
                    });
                },
                close: async () => {
                    return closeTicket(ticket.id);
                },
                delete: async () => {
                    return deleteTicket(ticket.id);
                },
                unassign: async () => {
                    return api.post(`/api/v1/tickets/${ticket.id}/unassign/`);
                },
                duplicate: async () => {
                    return api.post(
                        `/api/v1/tickets/${ticket.id}/duplicate/`,
                        {
                            mode: payload?.mode || 'linked',
                            intervention_type_id: payload?.intervention_type_id || null,
                        }
                    );
                },
            };

            if (!actionHandlers[action]) {
                throw new Error(`Action inconnue : ${action}`);
            }

            return actionHandlers[action]();
        },
        onSuccess: async (response, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ['ticket', effectiveTicketId],
            });

            if (variables.action === 'delete') {
                toast({
                    title: 'Ticket supprimé',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                if (onBack) {
                    onBack();
                } else {
                    navigate(-1);
                }
                return;
            }

            if (variables.action === 'duplicate' && response?.data) {
                const newTicket = response.data;
                toast({
                    title: 'Ticket dupliqué',
                    description: `Clone #${newTicket.number || newTicket.id} créé.`,
                    status: 'success',
                    duration: 4000,
                    isClosable: true,
                });
                navigate(`/tickets/${newTicket.id}`);
                return;
            }

            toast({
                title: 'Action exécutée',
                status: 'success',
                duration: 2500,
                isClosable: true,
            });
        },
        onError: (err: any) => {
            toast({
                title: 'Erreur action',
                description:
                    err?.response?.data?.detail ||
                    err?.message ||
                    'Erreur inconnue',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        },
    });

    // ======================================================
    // HANDLER
    // ======================================================
    const handleAction = async (action: string, payload?: any) => {
        await actionMutation.mutateAsync({
            action,
            payload,
        });
    };

    // ======================================================
    // UI FLAGS & TABS (Calculés via useMemo toujours actif)
    // ======================================================
    const showPlanningForm =
        ticket?.ui?.show_planning ??
        (ticket?.status === 'draft' || ticket?.status === 'pending');

    const showAdvancedTabs =
        ticket?.ui?.show_advanced_tabs ??
        (ticket?.status !== 'draft' && ticket?.status !== 'planned');

    const tabs = useMemo(() => {
        const items: {
            key: string;
            label: string;
            content: React.ReactNode;
        }[] = [];

        if (!ticket) return items;

        if (showAdvancedTabs) {
            items.push({
                key: 'fields',
                label: 'Compte rendu',
                content: <TicketFieldsTab ticket={ticket} onRefresh={refetch} />,
            });

            items.push({
                key: 'consumables',
                label: 'Consommables',
                content: <TicketConsumablesTab ticket={ticket} onRefresh={refetch} />,
            });

            items.push({
                key: 'result',
                label: 'Résultat',
                content: <TicketResultTab ticket={ticket} onRefresh={refetch} />,
            });
        }
        items.push({
            key: 'downtime',
            label: 'Arrêts machine',
            content: <TicketDowntimeTab ticket={ticket} onRefresh={refetch} />,
        });

        items.push({
            key: 'logs',
            label: 'Logs & Historique',
            content: <TicketLogsTab ticket={ticket} />,
        });

        return items;
    }, [showAdvancedTabs, ticket, refetch]);


    // ======================================================
    // 🛑 2. GESTION DES CLAUTES DE RENDU (EARLY RETURNS)
    // ======================================================

    // Vérification de sécurité sur la présence de l'ID globale
    if (!effectiveTicketId) {
        return (
            <Center h="80vh">
                <Text>Aucun ticket sélectionné.</Text>
            </Center>
        );
    }

    // Affichage des Skeletons de chargement
    if (isLoading || !ticket) {
        return (
            <Box p={6}>
                <VStack spacing={6} align="stretch">
                    <Skeleton h="100px" borderRadius="lg" />
                    <Box bg="white" p={6} borderRadius="lg">
                        <SkeletonText noOfLines={5} spacing={4} />
                    </Box>
                </VStack>
            </Box>
        );
    }

    // ======================================================
    // RENDER DE L'INTERFACE PRINCIPALE
    // ======================================================
    return (
        <Box bg="gray.50" minH="100vh">
            {/* HEADER */}
            <TicketHeader
                ticket={ticket}
                loading={actionMutation.isPending}
                onBack={() => (onBack ? onBack() : navigate(-1))}
                onAction={handleAction}
            />

            {/* CONTENT */}
            <Box p={6}>
                <VStack align="stretch" spacing={6}>
                    {/* AUTO REFRESH INDICATOR */}
                    if (isFetching) {
                        <Text fontSize="sm" color="gray.500">
                            Synchronisation...
                        </Text>
                    }

                    {/* STATUS */}
                    <TicketStatusDetail ticket={ticket} />

                    {/* PLANNING */}
                    {showPlanningForm && (
                        <TicketPlanningForm
                            ticketId={ticket.id}
                            currentStatus={ticket.status}
                            onPlanningComplete={() => {
                                refetch();
                            }}
                        />
                    )}

                    {/* TABS CENTRALISÉS */}
                    <Tabs
                        variant="enclosed"
                        colorScheme="purple"
                        bg="white"
                        p={4}
                        borderRadius="lg"
                        shadow="sm"
                        isLazy
                    >
                        <TabList>
                            {tabs.map((tab) => (
                                <Tab key={tab.key} fontWeight="semibold">
                                    {tab.label}
                                </Tab>
                            ))}
                        </TabList>

                        <TabPanels>
                            {tabs.map((tab) => (
                                <TabPanel key={tab.key} px={0} pt={4}>
                                    {tab.content}
                                </TabPanel>
                            ))}
                        </TabPanels>
                    </Tabs>
                </VStack>
            </Box>
        </Box>
    );
}