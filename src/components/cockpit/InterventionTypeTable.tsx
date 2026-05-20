import {
    Table, Thead, Tbody, Tr, Th, Td,
    Box, Button, Flex, Badge, IconButton,
    useDisclosure, useToast, Text, Spinner, Center, HStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../api/apiClient';
import InterventionTypeModal from './InterventionTypeModal';

export default function InterventionTypeTable() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const fetchTypes = async () => {
        try {
            setLoading(true);
            // 👈 ICI : Ajout du paramètre query pour demander au backend d'inclure les inactifs
            const res = await api.get('/api/v1/intervention-types/?include_inactive=true');
            setTypes(res.data.results || res.data);
        } catch (err) {
            toast({ title: "Erreur de chargement", status: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleEdit = (type: any) => {
        setSelectedType(type);
        onOpen();
    };

    const handleAdd = () => {
        setSelectedType(null);
        onOpen();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Supprimer ce type ? Cela peut échouer si des tickets y sont liés.")) {
            try {
                await api.delete(`/api/v1/intervention-types/${id}/`);
                toast({ title: "Supprimé avec succès", status: "success" });
                fetchTypes();
            } catch (err) {
                toast({ title: "Erreur", description: "Ce type est probablement utilisé.", status: "error" });
            }
        }
    };

    if (loading) return <Center p={10}><Spinner color="purple.500" /></Center>;

    return (
        <Box bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Text fontWeight="bold" fontSize="lg">Types d'Intervention</Text>
                    <Text fontSize="xs" color="gray.500">Définissez les catégories et champs personnalisés (Actifs et Inactifs)</Text>
                </Box>
                <Button leftIcon={<FiPlus />} colorScheme="purple" onClick={handleAdd} size="sm">
                    Nouveau Type
                </Button>
            </Flex>

            <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                    <Tr>
                        <Th>Statut</Th>
                        <Th>Nom</Th>
                        <Th>Description</Th>
                        <Th>Champs</Th>
                        <Th textAlign="center">Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {types.length === 0 ? (
                        <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.400">Aucun type configuré</Td></Tr>
                    ) : (
                        types.map((type: any) => (
                            <Tr
                                key={type.id}
                                _hover={{ bg: 'gray.50' }}
                                // 👈 ICI : Si le type est inactif, on applique une opacité pour le différencier graphiquement
                                opacity={type.is_active ? 1 : 0.65}
                                bg={type.is_active ? "transparent" : "gray.50"}
                            >
                                <Td>
                                    <Badge colorScheme={type.is_active ? "green" : "red"} variant="subtle">
                                        {type.is_active ? "Actif" : "Inactif"}
                                    </Badge>
                                </Td>
                                <Td fontWeight="bold" color={type.is_active ? "gray.800" : "gray.500"}>
                                    {type.name}
                                </Td>
                                <Td noOfLines={1} maxW="200px" color="gray.600">
                                    {type.description || "-"}
                                </Td>
                                <Td>
                                    {type.fields ? (
                                        <Badge variant="outline" colorScheme={type.is_active ? "blue" : "gray"}>
                                            {Object.keys(type.fields).length} champ(s)
                                        </Badge>
                                    ) : (
                                        <Text fontSize="xs" color="gray.400">Standard</Text>
                                    )}
                                </Td>
                                <Td>
                                    <HStack justify="center" spacing={2}>
                                        <IconButton
                                            aria-label="Edit" icon={<FiEdit2 />} size="xs" variant="ghost" colorScheme="blue"
                                            onClick={() => handleEdit(type)}
                                        />
                                        <IconButton
                                            aria-label="Delete" icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red"
                                            onClick={() => handleDelete(type.id)}
                                        />
                                    </HStack>
                                </Td>
                            </Tr>
                        ))
                    )}
                </Tbody>
            </Table>

            <InterventionTypeModal
                isOpen={isOpen}
                onClose={onClose}
                typeData={selectedType}
                onSuccess={fetchTypes}
            />
        </Box>
    );
}