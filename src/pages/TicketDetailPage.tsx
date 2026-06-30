import {
    Box,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Center,
    VStack,
    Text,
    useToast,
    Skeleton,
    SkeletonText,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import React, { useMemo, useState } from 'react';
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
interface Equipment { id: number; name: string; code?: string; }
interface InterventionType { id: number; name: string; color?: string; }
interface TicketLog { id: number; action: string; created_at: string; created_by_name?: string; message?: string; }
interface ConsumableUsage { id: number; quantity: number; consumable_name: string; }
interface TicketResult { result?: string; comment?: string; completed_at?: string; }
interface TicketPermissions {
    can_start?: boolean;
    can_assign?: boolean;
    can_complete?: boolean;
    can_close?: boolean;
    can_delete?: boolean;
    can_unassign?: boolean;
    can_duplicate?: boolean;
}
interface TicketUI { show_planning?: boolean; show_advanced_tabs?: boolean; }
export interface Ticket {
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

// ======================================================
// CUSTOM HOOKS
// ======================================================

const useTicket = (id?: string | number | null) => {
    return useQuery<Ticket>({
        queryKey: ['ticket', id],
        queryFn: async () => {
            if (!id) throw new Error("ID du ticket manquant");
            const response = await api.get(`/api/v1/tickets/${id}/`);
            return response.data;
        },
        enabled: !!id,
        staleTime: 1000 * 20,
        refetchOnWindowFocus: true,
    });
};

const useTicketActions = (
    ticket: Ticket | undefined,
    user: any,
    queryClient: any,
    toast: ReturnType<typeof useToast>,
    navigate: ReturnType<typeof useNavigate>,
    onBack?: () => void
) => {
    const actionMutation = useMutation({
        mutationFn: async ({ action, payload }: { action: string; payload?: any }) => {
            if (!ticket) throw new Error("Aucun ticket sélectionné");

            const actionHandlers: Record<string, () => Promise<any>> = {
                start: () => startTicket(ticket.id, { technician_id: user?.id || 1 }),
                assign: () => assignTicket(ticket.id, {
                    technician_id: payload?.technician_id || user?.id || 1,
                    planned_at: payload?.planned_at || new Date().toISOString(),
                }),
                complete: () => completeTicket(ticket.id, {
                    technician_id: user?.id || 1,
                    result: payload?.result,
                    reason: payload?.reason,
                    comment: payload?.comment,
                }),
                close: () => closeTicket(ticket.id),
                delete: () => deleteTicket(ticket.id),
                unassign: () => api.post(`/api/v1/tickets/${ticket.id}/unassign/`),
                duplicate: () => api.post(`/api/v1/tickets/${ticket.id}/duplicate/`, {
                    mode: payload?.mode || 'linked',
                    intervention_type_id: payload?.intervention_type_id || null,
                }),
            };

            if (!actionHandlers[action]) throw new Error(`Action inconnue : ${action}`);
            return actionHandlers[action]();
        },
        onSuccess: async (response, variables) => {
            await queryClient.invalidateQueries({ queryKey: ['ticket', ticket?.id] });

            if (variables.action === 'delete') {
                toast({ title: 'Ticket supprimé', status: 'success', duration: 3000, isClosable: true });
                onBack ? onBack() : navigate('/dashboard/tickets');
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
                navigate(`/dashboard/tickets/${newTicket.id}`);
                return;
            }

            toast({ title: 'Action exécutée', status: 'success', duration: 2500, isClosable: true });
        },
        onError: (err: any) => {
            toast({
                title: 'Erreur action',
                description: err?.response?.data?.detail || err?.message || 'Erreur inconnue',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        },
    });

    return {
        handleAction: async (action: string, payload?: any) => actionMutation.mutateAsync({ action, payload }),
        isPending: actionMutation.isPending,
    };
};

/**
 * Hook pour gérer la génération et le téléchargement du PDF
 */
const useDownloadPdf = (toast: ReturnType<typeof useToast>) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadPdf = async (ticketId: string | number, ticketNumber?: string) => {
        setIsDownloading(true);
        try {
            const response = await api.get(`/api/v1/tickets/${ticketId}/pdf/`, {
                responseType: 'blob',
            });

            // Création d'une URL locale pour le blob binaire
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Création et clic sur un lien invisible
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ticket-${ticketNumber || ticketId}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Nettoyage du DOM
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast({
                title: "Impossible de générer le PDF du ticket.",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return { downloadPdf, isDownloading };
};

// ======================================================
// HELPERS & SOUS-COMPOSANTS
// ======================================================

const buildTabs = (ticket: Ticket, refetch: () => void) => {
    const showAdvancedTabs = ticket?.ui?.show_advanced_tabs ?? (ticket?.status !== 'draft' && ticket?.status !== 'planned');
    const tabs = [];

    if (showAdvancedTabs) {
        tabs.push(
            { key: 'fields', label: 'Compte rendu', content: <TicketFieldsTab ticket={ticket} onRefresh={refetch} /> },
            { key: 'consumables', label: 'Consommables', content: <TicketConsumablesTab ticket={ticket} onRefresh={refetch} /> },
            { key: 'result', label: 'Résultat', content: <TicketResultTab ticket={ticket} onRefresh={refetch} /> }
        );
    }

    tabs.push(
        { key: 'downtime', label: 'Arrêts machine', content: <TicketDowntimeTab ticket={ticket} onRefresh={refetch} /> },
        { key: 'logs', label: 'Logs & Historique', content: <TicketLogsTab ticket={ticket} /> }
    );

    return tabs;
};

const TicketSkeleton = () => (
    <Box p={6}>
        <VStack spacing={6} align="stretch">
            <Skeleton h="100px" borderRadius="lg" />
            <Box bg="white" p={6} borderRadius="lg">
                <SkeletonText noOfLines={5} spacing={4} />
            </Box>
        </VStack>
    </Box>
);

const TicketError = ({ error }: { error: any }) => (
    <Box p={6}>
        <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
                <AlertTitle>Impossible de charger le ticket</AlertTitle>
                <AlertDescription>{error?.message || 'Une erreur est survenue lors de la récupération des données.'}</AlertDescription>
            </Box>
        </Alert>
    </Box>
);

// ======================================================
// COMPOSANT PRINCIPAL
// ======================================================

export default function TicketDetailPage() {
    const { id } = useParams(); // Récupère directement l'ID depuis l'URL
    const navigate = useNavigate();
    const toast = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: ticket, isLoading, isError, error, refetch } = useTicket(id);

    // On s'assure que toutes les actions pointent sur le routage du Dashboard
    const { handleAction, isPending } = useTicketActions(
        ticket,
        user,
        queryClient,
        toast,
        navigate,
        () => navigate('/dashboard/tickets')
    );

    const { downloadPdf, isDownloading } = useDownloadPdf(toast);

    const tabs = useMemo(() => ticket ? buildTabs(ticket, refetch) : [], [ticket, refetch]);

    if (!id) {
        return <Center h="100%"><Text>Aucun ticket sélectionné.</Text></Center>;
    }

    if (isLoading) return <TicketSkeleton />;
    if (isError) return <TicketError error={error} />;
    if (!ticket) return null;

    const showPlanningForm = ticket.permissions?.can_assign && !ticket.technician_name;

    return (
        <Box w="full">
            <TicketHeader
                ticket={ticket}
                loading={isPending}
                onBack={() => navigate('/dashboard/tickets')} // Retour formel et sécurisé
                onAction={handleAction}
                onDownloadPdf={() => downloadPdf(ticket.id, ticket.number)}
                isDownloadingPdf={isDownloading}
            />

            <VStack align="stretch" spacing={6} mt={6}>
                <TicketStatusDetail ticket={ticket} />

                {showPlanningForm && (
                    <TicketPlanningForm
                        ticketId={ticket.id}
                        currentStatus={ticket.status}
                        onPlanningComplete={() => refetch()}
                    />
                )}

                <Tabs
                    variant="enclosed"
                    colorScheme="purple"
                    bg="white"
                    p={4}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.200"
                    shadow="sm"
                    isLazy
                >
                    <TabList>
                        {tabs.map((tab) => (
                            <Tab key={tab.key} fontWeight="semibold">{tab.label}</Tab>
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
    );
}