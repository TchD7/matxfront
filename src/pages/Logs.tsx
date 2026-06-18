import { useEffect, useState } from 'react';
import {
    Box,
    Heading,
    Spinner,
    Center,
    Text,
    Button,
    Container,
    Flex,
    useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { RiDownload2Line, RiArrowLeftLine } from 'react-icons/ri';

import api from '../api/apiClient';
import TicketTable from '../components/dashboard/TicketTable';
import { handleExportTickets } from '../components/common/ExportButton';

interface LogsProps {
    onBack?: () => void;
}

export default function Logs({ onBack }: LogsProps) {
    const navigate = useNavigate();
    const toast = useToast();

    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDrafts = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/v1/ticket-analytics/', {
                    params: { page_size: 50, status: 'draft' }
                });

                const data = res.data;
                const results = data.results || data.data?.results || (Array.isArray(data) ? data : []);
                setTickets(results);
            } catch (err: any) {
                console.error('Erreur fetching logs:', err);
                setError(err?.message || 'Erreur lors du chargement des logs');
            } finally {
                setLoading(false);
            }
        };

        fetchDrafts();
    }, []);

    const handleOpenTicket = (id: string | number) => {
        navigate(`/dashboard/tickets/${id}`);
    };

    if (loading && tickets.length === 0) {
        return (
            <Center py={10}>
                <Spinner size="lg" color="purple.500" />
            </Center>
        );
    }

    return (
        <Container maxW="full" p={0}>
            <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
                <Box>
                    <Button size="sm" variant="ghost" leftIcon={<RiArrowLeftLine />} mb={2} onClick={onBack}>
                        Retour
                    </Button>
                    <Heading size="md">Logs (Qualifiés) - {tickets.length} tickets</Heading>
                </Box>

                <Button
                    leftIcon={<RiDownload2Line />}
                    colorScheme="purple"
                    variant="outline"
                    isLoading={exporting}
                    onClick={() => handleExportTickets({ status: 'draft' }, setExporting, toast)}
                >
                    Exporter
                </Button>
            </Flex>

            {error && (
                <Text color="red.500" mb={4} p={4} borderWidth="1px" borderColor="red.200" borderRadius="md">
                    {error}
                </Text>
            )}

            <TicketTable
                tickets={tickets}
                loading={loading}
                onOpenTicket={handleOpenTicket}
            />
        </Container>
    );
}