import { useEffect, useState } from 'react';
import {
    Box,
    Heading,
    Spinner,
    Center,
    Text,
    Button,
    Container,
} from '@chakra-ui/react';
import api from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import TicketTable from '../components/dashboard/TicketTable';

interface LogsProps {
    onBack?: () => void;
}

export default function Logs({ onBack }: LogsProps) {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDrafts = async () => {
            try {
                const res = await api.get('/api/v1/ticket-analytics/?page_size=50&status=draft');
                const payload = res.data?.data ?? res.data?.results ?? res.data;

                // Normaliser la liste des tickets
                let items: any[] = [];
                if (Array.isArray(payload)) {
                    items = payload;
                } else if (Array.isArray(payload?.results)) {
                    items = payload.results;
                } else if (Array.isArray(payload?.data)) {
                    items = payload.data;
                }

                setTickets(items);
            } catch (err: any) {
                console.error('Erreur fetching logs:', err);
                setError(err?.message || 'Erreur lors du chargement des logs');
            } finally {
                setLoading(false);
            }
        };

        fetchDrafts();
    }, []);

    const navigate = useNavigate();

    const handleOpenTicket = (id: number) => {
        navigate(`/tickets/${id}`);
    };

    if (loading) {
        return (
            <Center py={10}>
                <Spinner size="lg" color="purple.500" />
            </Center>
        );
    }

    return (
        <Container maxW="full" p={0}>
            <Box mb={6}>
                <Heading size="md" mb={4}>Logs  {tickets.length} tickets</Heading>

                <Button size="sm" variant="ghost" mb={4} onClick={onBack}>
                    Retour
                </Button>

                {error && (
                    <Text color="red.500" mb={4}>{error}</Text>
                )}
            </Box>

            <TicketTable
                tickets={tickets}
                loading={loading}
                onOpenTicket={handleOpenTicket}
            />
        </Container>
    );
}
