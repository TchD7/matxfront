import {
    Box,
    VStack,
    HStack,
    Text,
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
    List,
    ListItem,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
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
    ticket: string;
    consumable: number;
    consumable_name?: string;
    consumable_unit?: string;
    quantity_used: number;
    used_by_name?: string;
}

interface Ticket {
    id: string;
    status?: string; // 👈 Ajouté ici pour éviter l'erreur de soulignement rouge
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
    const [tableLoading, setTableLoading] = useState(false);

    // Liste des consommables actuellement liés à ce ticket
    const [localConsumables, setLocalConsumables] = useState<TicketConsumable[]>([]);

    // États pour la recherche asynchrone dans le catalogue global
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Consumable[]>([]);
    const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [quantity, setQuantity] = useState('');

    // ================= UI CALCULATIONS =================
    const isClosed = ticket?.status === 'closed'; // Variable barrière

    // ================= LOAD TICKET CONSUMABLES =================
    const loadTicketConsumables = async () => {
        if (!ticket?.id) return;
        try {
            setTableLoading(true);
            const res = await api.get(`/api/v1/ticket-consumables/?ticket=${ticket.id}`);
            setLocalConsumables(res.data.results || res.data || []);
        } catch {
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les consommables du ticket.',
                status: 'error',
            });
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        loadTicketConsumables();
    }, [ticket?.id]);

    // ================= SEARCH CATALOG ASYNC =================
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                const res = await api.get(`/api/v1/ticket-consumables/search-catalog/?q=${searchQuery}`);
                setSearchResults(res.data.results || res.data || []);
            } catch {
                // Erreur silencieuse pour la recherche à la volée
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // ================= ADD CONSUMABLE =================
    const addConsumable = async () => {
        if (!selectedConsumable || !quantity || isClosed) return;

        try {
            setLoading(true);
            await api.post('/api/v1/ticket-consumables/', {
                ticket: ticket.id,
                consumable: selectedConsumable.id,
                quantity_used: Number(quantity),
            });

            toast({
                title: 'Consommable ajouté',
                status: 'success',
            });

            setSelectedConsumable(null);
            setSearchQuery('');
            setQuantity('');

            loadTicketConsumables();
            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur ajout consommable',
                description: err.response?.data?.detail || "Vérifiez les valeurs saisies.",
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // ================= REMOVE CONSUMABLE =================
    const removeConsumable = async (id: number) => {
        if (isClosed) return;
        try {
            await api.delete(`/api/v1/ticket-consumables/${id}/`);
            toast({ title: 'Consommable retiré', status: 'success' });
            loadTicketConsumables();
            onRefresh();
        } catch {
            toast({ title: 'Erreur lors de la suppression', status: 'error' });
        }
    };

    // ================= UI PROTECTION =================
    if (!ticket) {
        return (
            <Center py={10}>
                <Spinner color="purple.500" />
            </Center>
        );
    }

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">

                {/* CONDITION : FORMULAIRE OU BANDEAU SÉCURISÉ */}
                {isClosed ? (
                    <Alert status="info" variant="solid" borderRadius="lg" bg="gray.100" color="gray.800">
                        <AlertIcon color="gray.500" />
                        <Box>
                            <AlertTitle fontWeight="bold">Sortie de stock verrouillée</AlertTitle>
                            <AlertDescription fontSize="sm">
                                Ce ticket est clôturé. L'inventaire des pièces et consommables utilisés est passé en lecture seule.
                            </AlertDescription>
                        </Box>
                    </Alert>
                ) : (
                    <HStack spacing={4} align="flex-start">
                        {/* Recherche Asynchrone */}
                        <Box position="relative" flex={2}>
                            <Input
                                placeholder="Rechercher un consommable (ex: Câble, Vis...)"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                    if (selectedConsumable) setSelectedConsumable(null);
                                }}
                                onFocus={() => setShowDropdown(true)}
                            />
                            {selectedConsumable && (
                                <Text fontSize="xs" color="purple.600" mt={1} fontWeight="semibold">
                                    Sélectionné : {selectedConsumable.name} ({selectedConsumable.unit})
                                </Text>
                            )}

                            {/* Dropdown flottant */}
                            {showDropdown && searchResults.length > 0 && (
                                <List
                                    position="absolute"
                                    top="110%"
                                    left={0}
                                    right={0}
                                    bg="white"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    boxShadow="md"
                                    zIndex={10}
                                    maxH="200px"
                                    overflowY="auto"
                                >
                                    {searchResults.map((c) => (
                                        <ListItem
                                            key={c.id}
                                            px={4}
                                            py={2}
                                            _hover={{ bg: 'purple.50', cursor: 'pointer' }}
                                            onClick={() => {
                                                setSelectedConsumable(c);
                                                setSearchQuery(c.name);
                                                setShowDropdown(false);
                                            }}
                                            fontSize="sm"
                                        >
                                            <strong>{c.name}</strong> — {c.unit}
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>

                        {/* Champ Quantité */}
                        <Input
                            flex={1}
                            type="number"
                            placeholder="Quantité"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />

                        {/* Bouton de validation */}
                        <Button
                            colorScheme="purple"
                            onClick={addConsumable}
                            isLoading={loading}
                            isDisabled={!selectedConsumable || !quantity || Number(quantity) <= 0}
                        >
                            Ajouter
                        </Button>
                    </HStack>
                )}

                {/* TABLEAU DES LIAISONS */}
                <Box borderWidth="1px" borderRadius="lg" overflow="hidden" position="relative">
                    {tableLoading && (
                        <Center position="absolute" top={0} bottom={0} left={0} right={0} bg="rgba(255,255,255,0.7)" zIndex={2}>
                            <Spinner color="purple.500" />
                        </Center>
                    )}

                    <Table size="sm">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th py={3}>Pièce</Th>
                                <Th py={3}>Quantité</Th>
                                <Th py={3}>Unité</Th>
                                {!isClosed && <Th py={3} textAlign="right">Actions</Th>}
                            </Tr>
                        </Thead>

                        <Tbody>
                            {localConsumables.length ? (
                                localConsumables.map((c) => (
                                    <Tr key={c.id}>
                                        <Td py={3}>{c.consumable_name || `ID Consommable: ${c.consumable}`}</Td>
                                        <Td py={3} fontWeight="bold" color="purple.700">
                                            {c.quantity_used}
                                        </Td>
                                        <Td py={3}>{c.consumable_unit || '-'}</Td>

                                        {/* Masquer le bouton de suppression si clôturé */}
                                        {!isClosed && (
                                            <Td py={3} textAlign="right">
                                                <Button
                                                    size="xs"
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    onClick={() => removeConsumable(c.id)}
                                                >
                                                    Retirer
                                                </Button>
                                            </Td>
                                        )}
                                    </Tr>
                                ))
                            ) : (
                                <Tr>
                                    <Td colSpan={isClosed ? 3 : 4} py={6} textAlign="center">
                                        <Text fontSize="sm" color="gray.500">
                                            Aucun consommable enregistré sur ce ticket.
                                        </Text>
                                    </Td>
                                </Tr>
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </VStack>

            {showDropdown && <Box position="fixed" top={0} bottom={0} left={0} right={0} zIndex={5} onClick={() => setShowDropdown(false)} />}
        </Box>
    );
}