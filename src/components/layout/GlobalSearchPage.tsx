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
    Flex,
    Button,
    useToast,
} from '@chakra-ui/react';
import { RiDownload2Line } from 'react-icons/ri';

import api from '../../api/apiClient';
import TicketTable from '../../components/dashboard/TicketTable';
import { handleExportTickets } from '../common/ExportButton';

interface GlobalSearchPageProps {
    query: string;
}

export default function GlobalSearchPage({ query }: GlobalSearchPageProps) {
    const navigate = useNavigate();
    const toast = useToast();

    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
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

    const handleOpenTicket = (id: string | number) => {
        navigate(`/dashboard/tickets/${id}`);
    };

    return (
        <Container maxW="full" py={8} px={{ base: 4, md: 8 }}>
            <Flex justify="space-between" align="flex-start" mb={8} wrap="wrap" gap={4}>
                <Box>
                    <Heading size="lg" mb={2}>Résultats de recherche</Heading>
                    <Text color="gray.600" fontSize="sm">
                        Requête : <Text as="span" fontWeight="bold" color="purple.600">{query || '(vide)'}</Text>
                    </Text>
                </Box>

                {tickets.length > 0 && (
                    <Button
                        leftIcon={<RiDownload2Line />}
                        colorScheme="purple"
                        variant="outline"
                        isLoading={exporting}
                        onClick={() => handleExportTickets({ search: query.trim() }, setExporting, toast)}
                    >
                        Exporter les résultats
                    </Button>
                )}
            </Flex>

            {error && (
                <Alert status="error" variant="subtle" borderRadius="lg" mb={6}>
                    <AlertIcon />
                    <Box>
                        <AlertTitle>Erreur de recherche</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Box>
                </Alert>
            )}

            {!loading && tickets.length === 0 && query.trim() !== "" && !error && (
                <Alert status="info" variant="subtle" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                        <AlertTitle>Aucun ticket trouvé</AlertTitle>
                        <AlertDescription>Essayez de modifier votre recherche ou vérifiez le numéro de ticket.</AlertDescription>
                    </Box>
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