import {
    Box,
    Button,
    Flex,
    Badge,
    IconButton,
    useDisclosure,
    useToast,
    Text,
    Spinner,
    Center,
    HStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
} from '@chakra-ui/react';

import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

import api from '../../api/apiClient';
// Import nommé corrigé pour éviter le SyntaxError au chargement du module
import InterventionTypeModal from './InterventionTypeModal';

// ================= TYPES =================
type InterventionType = {
    id: number | string;
    name: string;
    description?: string;
    is_active: boolean;
    fields?: Record<string, any>;
};

// ================= COMPONENT =================
export default function InterventionTypeTable() {

    const [types, setTypes] = useState<InterventionType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<InterventionType | null>(null);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // ============================================================
    // DATA FETCHING
    // ============================================================
    const fetchTypes = useCallback(async () => {
        try {
            setLoading(true);

            const { data } = await api.get(
                '/api/v1/intervention-types/?include_inactive=true'
            );

            setTypes(data.results ?? data);

        } catch (error) {
            toast({
                title: "Erreur de chargement",
                description: "Impossible de récupérer les types d'intervention.",
                status: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    // ============================================================
    // ACTIONS
    // ============================================================
    const handleAdd = () => {
        setSelectedType(null);
        onOpen();
    };

    const handleEdit = (type: InterventionType) => {
        setSelectedType(type);
        onOpen();
    };

    const handleDelete = async (id: string | number) => {
        const confirmDelete = window.confirm(
            "Supprimer ce type ? Cette action peut échouer si des données sont liées."
        );

        if (!confirmDelete) return;

        try {
            await api.delete(`/api/v1/intervention-types/${id}/`);

            toast({
                title: "Type supprimé",
                status: "success",
            });

            fetchTypes();

        } catch (error) {
            toast({
                title: "Suppression impossible",
                description: "Ce type est probablement utilisé.",
                status: "error",
            });
        }
    };

    // ============================================================
    // UI STATES
    // ============================================================
    if (loading) {
        return (
            <Center p={10}>
                <Spinner color="purple.500" />
            </Center>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <Box
            bg="white"
            p={5}
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.100"
        >

            {/* HEADER */}
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Text fontWeight="bold" fontSize="lg">
                        Types d'intervention
                    </Text>

                    <Text fontSize="xs" color="gray.500">
                        Gestion des catégories et de leurs champs dynamiques
                    </Text>
                </Box>

                <Button
                    leftIcon={<FiPlus />}
                    colorScheme="purple"
                    size="sm"
                    onClick={handleAdd}
                >
                    Nouveau type
                </Button>
            </Flex>

            {/* TABLE */}
            <Table size="sm" variant="simple">

                <Thead bg="gray.50">
                    <Tr>
                        <Th>Statut</Th>
                        <Th>Nom</Th>
                        <Th>Description</Th>
                        <Th>Structure</Th>
                        <Th textAlign="center">Actions</Th>
                    </Tr>
                </Thead>

                <Tbody>

                    {types.length === 0 ? (
                        <Tr>
                            <Td colSpan={5} textAlign="center" py={10}>
                                <Text color="gray.400">
                                    Aucun type configuré
                                </Text>
                            </Td>
                        </Tr>
                    ) : (

                        types.map((type) => (
                            <Tr
                                key={type.id}
                                _hover={{ bg: 'gray.50' }}
                                opacity={type.is_active ? 1 : 0.6}
                                bg={type.is_active ? 'transparent' : 'gray.50'}
                            >

                                {/* STATUS */}
                                <Td>
                                    <Badge
                                        colorScheme={
                                            type.is_active ? 'green' : 'red'
                                        }
                                    >
                                        {type.is_active ? 'Actif' : 'Inactif'}
                                    </Badge>
                                </Td>

                                {/* NAME */}
                                <Td fontWeight="bold">
                                    {type.name}
                                </Td>

                                {/* DESCRIPTION */}
                                <Td color="gray.600" noOfLines={1}>
                                    {type.description || '-'}
                                </Td>

                                {/* FIELDS */}
                                <Td>
                                    {type.fields ? (
                                        <Badge
                                            colorScheme="blue"
                                            variant="outline"
                                        >
                                            {Object.keys(type.fields).length} champs
                                        </Badge>
                                    ) : (
                                        <Text fontSize="xs" color="gray.400">
                                            Standard
                                        </Text>
                                    )}
                                </Td>

                                {/* ACTIONS */}
                                <Td>
                                    <HStack justify="center">

                                        <IconButton
                                            aria-label="edit"
                                            icon={<FiEdit2 />}
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="blue"
                                            onClick={() => handleEdit(type)}
                                        />

                                        <IconButton
                                            aria-label="delete"
                                            icon={<FiTrash2 />}
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => handleDelete(type.id)}
                                        />

                                    </HStack>
                                </Td>

                            </Tr>
                        ))

                    )}

                </Tbody>

            </Table>

            {/* MODAL (Utilisation de l'import nommé avec ses propriétés requises) */}
            <InterventionTypeModal
                isOpen={isOpen}
                onClose={onClose}
                interventionType={selectedType}
                onSuccess={fetchTypes}
            />

        </Box>
    );
}