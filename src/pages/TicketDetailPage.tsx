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
} from '@chakra-ui/react';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import api from '../api/apiClient';

// Components
import TicketHeader from '../components/tickets/TicketHeader';
import TicketStatusDetail from '../components/tickets/TicketStatusDetail';
import TicketPlanningForm from '../components/tickets/TicketPlanningForm';
import TicketLogsTab from '../components/tickets/TicketLogsTab';
import TicketFieldsTab from '../components/tickets/TicketFieldsTab';
import TicketConsumablesTab from '../components/tickets/TicketConsumablesTab';

// Actions
import {
    startTicket,
    assignTicket,
    completeTicket,
    closeTicket,
    deleteTicket,
} from '../services/ticketActions';

// ================= TYPES =================
interface Ticket {
    id: string;
    status: string;
    equipment?: any;
    intervention_type?: any;
    logs?: any[];
    consumables?: any[];
    downtime_logs?: any[];
    fields?: any[];
    result?: any;
    permissions?: Record<string, boolean>;
}

interface TicketDetailPageProps {
    ticketId?: string | number | null;
    onBack?: () => void;
}

// ================= COMPONENT =================
export default function TicketDetailPage({ ticketId, onBack }: TicketDetailPageProps) {
    const { id } = useParams();
    const navigate = useNavigate();
    const effectiveTicketId = ticketId ?? id;

    if (!effectiveTicketId) {
        return (
            <Center h="80vh">
                <Text>Aucun ticket sélectionné.</Text>
            </Center>
        );
    }
    const toast = useToast();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // ================= FETCH =================
    const fetchTicket = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/v1/tickets/${effectiveTicketId}/`);
            setTicket(res.data);
        } catch (err) {
            toast({
                title: 'Erreur chargement ticket',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [effectiveTicketId, toast]);

    useEffect(() => {
        fetchTicket();
    }, [fetchTicket, refreshKey]);

    // ================= REFRESH =================
    const refresh = () => setRefreshKey((p) => p + 1);

    // ================= ACTION HANDLER =================
    const handleAction = async (action: string) => {
        if (!ticket) return;

        try {
            switch (action) {
                case 'start':
                    await startTicket(ticket.id, { technician_id: 1 });
                    break;

                case 'duplicate':
                    // Appel à ton API Django (ex: POST /api/v1/tickets/123/duplicate/)
                    // Ton backend devrait renvoyer les données du nouveau ticket, dont son nouvel ID
                    const response = await api.post(`/api/v1/tickets/${ticket.id}/duplicate/`);
                    const newTicket = response.data;

                    toast({
                        title: 'Ticket dupliqué',
                        description: `Le ticket clone #${newTicket.number || newTicket.id} a été créé.`,
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                    });

                    // Redirection vers le nouveau ticket pour que l'utilisateur puisse le modifier/traiter
                    if (onBack) {
                        // Si tu es dans un tiroir (Drawer) ou une modale, on rafraîchit la liste parente
                        onBack();
                    } else {
                        // Si tu es sur une page classique, on navigue vers le détail du nouveau ticket
                        navigate(`/tickets/${newTicket.id}`);
                    }
                    return; // On quitte la fonction pour éviter le refresh() du vieux ticket

                case 'complete':
                    await completeTicket(ticket.id, { technician_id: currentTechId, result: 'ok' });
                    break;
                case 'complete':
                    await completeTicket(ticket.id, { technician_id: 1, result: 'ok' });
                    break;
                case 'close':
                    await closeTicket(ticket.id);
                    break;
                case 'delete':
                    await deleteTicket(ticket.id);
                    if (onBack) {
                        onBack();
                    } else {
                        navigate(-1);
                    }
                    return; // On quitte la fonction car le ticket est supprimé
                case 'assign':
                    await assignTicket(ticket.id, {
                        technician_id: 1,
                        planned_at: new Date().toISOString(),
                    });
                    break;
            }

            toast({
                title: 'Action exécutée',
                status: 'success',
            });

            refresh();
        } catch (err: any) {
            toast({
                title: 'Erreur action',
                description: err.response?.data?.detail,
                status: 'error',
            });
        }
    };

    // ================= LOADING =================
    if (loading || !ticket) {
        return (
            <Center h="80vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    // Définir ici les statuts où la planification est encore autorisée
    const showPlanningForm = ticket.status === 'draft' || ticket.status === 'pending';

    // ================= UI =================
    return (
        <Box bg="gray.50" minH="100vh">
            {/* HEADER */}
            <TicketHeader
                ticket={ticket}
                onBack={() => (onBack ? onBack() : navigate(-1))}
                onAction={handleAction}
            />

            {/* CONTENT */}
            <Box p={6}>
                <VStack align="stretch" spacing={6}>
                    {/* STATUS DETAIL INTELLIGENT */}
                    <TicketStatusDetail ticket={ticket} />

                    {/* PLANNING FORM - Masqué dynamiquement une fois planifié */}
                    {showPlanningForm && (
                        <TicketPlanningForm
                            ticketId={ticket.id}
                            currentStatus={ticket.status}
                            onPlanningComplete={refresh}
                        />
                    )}

                    {/* CENTRALIZED TABS COMPONENT */}
                    <Tabs variant="enclosed" colorScheme="purple" bg="white" p={4} borderRadius="lg" shadow="sm">
                        <TabList>
                            <Tab fontWeight="semibold">Champs personnalisés</Tab>
                            <Tab fontWeight="semibold">Consommables</Tab>
                            <Tab fontWeight="semibold">Logs & Historique</Tab>
                        </TabList>

                        <TabPanels>
                            {/* FIELDS */}
                            <TabPanel px={0} pt={4}>
                                <TicketFieldsTab ticket={ticket} />
                            </TabPanel>

                            {/* CONSUMABLES */}
                            <TabPanel px={0} pt={4}>
                                <TicketConsumablesTab ticket={ticket} onRefresh={refresh} />
                            </TabPanel>

                            {/* LOGS */}
                            <TabPanel px={0} pt={4}>
                                <TicketLogsTab ticket={ticket} />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </VStack>
            </Box>
        </Box>
    );
}