import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Heading,
    Text,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import api from '../../api/apiClient';
import TicketTable from '../../components/dashboard/TicketTable';

interface GlobalSearchPageProps {
    query: string;
}

export default function GlobalSearchPage({ query }: GlobalSearchPageProps) {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query.trim()) {
            setTickets([]);
            setError(null);
            return;
        }

        const fetchSearchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get('/api/v1/ticket-analytics/', {
                    params: {
                        search: query.trim(),
                        page_size: 50,
                    },
                });

                const data = response.data;
                const results = data.results || data.data?.results || (Array.isArray(data) ? data : []);

                setTickets(results);
            } catch (err: any) {
                console.error('Erreur recherche :', err);
                setError(err?.response?.data?.detail || 'Erreur lors de la recherche');
                setTickets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]);

    const handleOpenTicket = (id: number) => {
        navigate(`/tickets/${id}`);
    };

    return (
        <Container maxW="full" py={8} px={{ base: 4, md: 8 }}>
            <Box mb={8}>
                <Heading size="lg" mb={2}>
                    Résultats de recherche
                </Heading>
                <Text color="gray.600" fontSize="sm">
                    Requête : <Text as="span" fontWeight="bold" color="purple.600">{query || '(vide)'}</Text>
                </Text>
            </Box>

            {error && (
                <Alert
                    status="error"
                    variant="subtle"
                    flexDirection="column"
                    alignItems="flex-start"
                    borderRadius="lg"
                    mb={6}
                >
                    <Box display="flex" alignItems="center">
                        <AlertIcon mr={2} />
                        <AlertTitle>Erreur de recherche</AlertTitle>
                    </Box>
                    <AlertDescription mt={2}>{error}</AlertDescription>
                </Alert>
            )}

            {!loading && tickets.length === 0 && !error && (
                <Alert
                    status="info"
                    variant="subtle"
                    borderRadius="lg"
                    flexDirection="column"
                    alignItems="flex-start"
                >
                    <Box display="flex" alignItems="center">
                        <AlertIcon mr={2} />
                        <AlertTitle>Aucun ticket trouvé</AlertTitle>
                    </Box>
                    <AlertDescription mt={2}>
                        Essayez de modifier votre recherche ou vérifiez le numéro de ticket.
                    </AlertDescription>
                </Alert>
            )}

            {(loading || tickets.length > 0) && (
                <TicketTable
                    tickets={tickets}
                    loading={loading}
                    onOpenTicket={handleOpenTicket}
                />
            )}
        </Container>
    );
}