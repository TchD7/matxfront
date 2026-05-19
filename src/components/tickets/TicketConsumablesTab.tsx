import {
    Box,
    VStack,
    HStack,
    Text,
    Select,
    Input,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useToast,
    Spinner,
    Center,
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import api from '../../api/apiClient';

// ================= TYPES =================
interface Consumable {
    id: number;
    name: string;
    unit: string;
}

interface TicketConsumable {
    id: number;
    consumable: number;
    consumable_name?: string;
    consumable_unit?: string;
    quantity_used: number;
}

interface Ticket {
    id: string;
    consumables?: TicketConsumable[];
}

// ================= COMPONENT =================
export default function TicketConsumablesTab({
    ticket,
    onRefresh,
}: {
    ticket: Ticket;
    onRefresh: () => void;
}) {
    const toast = useToast();

    const [loading, setLoading] = useState(false);

    const [consumables, setConsumables] = useState<Consumable[]>([]);

    const [selectedConsumable, setSelectedConsumable] = useState('');
    const [quantity, setQuantity] = useState('');

    // ================= LOAD REFERENCES =================
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/api/v1/consumables/');
                setConsumables(res.data.results || res.data || []);
            } catch {
                toast({
                    title: 'Erreur chargement consommables',
                    status: 'error',
                });
            }
        };

        load();
    }, []);

    // ================= ADD CONSUMABLE =================
    const addConsumable = async () => {
        try {
            setLoading(true);

            await api.post(`/api/v1/tickets/${ticket.id}/consumables/`, {
                consumable_id: Number(selectedConsumable),
                quantity_used: Number(quantity),
            });

            toast({
                title: 'Consommable ajouté',
                status: 'success',
            });

            setSelectedConsumable('');
            setQuantity('');

            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur ajout consommable',
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

    return (
        <Box p={4}>

            <VStack spacing={6} align="stretch">

                {/* ADD FORM */}
                <HStack spacing={4}>

                    <Select
                        placeholder="Consommable"
                        value={selectedConsumable}
                        onChange={(e) => setSelectedConsumable(e.target.value)}
                    >
                        {consumables.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.unit})
                            </option>
                        ))}
                    </Select>

                    <Input
                        type="number"
                        placeholder="Quantité"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />

                    <Button
                        colorScheme="purple"
                        onClick={addConsumable}
                        isLoading={loading}
                        isDisabled={!selectedConsumable || !quantity}
                    >
                        Ajouter
                    </Button>

                </HStack>

                {/* TABLE */}
                <Box borderWidth="1px" borderRadius="lg" overflow="hidden">

                    <Table size="sm">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>Pièce</Th>
                                <Th>Quantité</Th>
                                <Th>Unité</Th>
                            </Tr>
                        </Thead>

                        <Tbody>
                            {ticket.consumables?.length ? (
                                ticket.consumables.map((c) => (
                                    <Tr key={c.id}>
                                        <Td>{c.consumable_name || c.consumable}</Td>
                                        <Td fontWeight="bold">
                                            {c.quantity_used}
                                        </Td>
                                        <Td>{c.consumable_unit || '-'}</Td>
                                    </Tr>
                                ))
                            ) : (
                                <Tr>
                                    <Td colSpan={3}>
                                        <Text fontSize="sm" color="gray.500">
                                            Aucun consommable utilisé
                                        </Text>
                                    </Td>
                                </Tr>
                            )}
                        </Tbody>

                    </Table>

                </Box>

            </VStack>

        </Box>
    );
}