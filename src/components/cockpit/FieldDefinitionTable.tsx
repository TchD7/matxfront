import {
    Table, Thead, Tbody, Tr, Th, Td,
    Box, Button, Flex, Badge, IconButton,
    useDisclosure, useToast, Text, Spinner, Center, HStack
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiList } from 'react-icons/fi';

import api from '../../api/apiClient';
import FieldDefinitionModal from './FieldDefinitionModal';

export default function FieldDefinitionTable() {

    const [fields, setFields] = useState<any[]>([]);
    const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedField, setSelectedField] = useState<any>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const toast = useToast();

    // ================= FETCH FIELDS =================
    const fetchFields = async () => {
        try {
            setLoading(true);

            const res = await api.get('/api/v1/field-definitions/');
            setFields(res.data.results || res.data);

        } catch (err) {
            toast({
                title: "Erreur chargement champs",
                status: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    // ================= FETCH TYPES =================
    const fetchTypes = async () => {
        try {
            const res = await api.get('/api/v1/intervention-types/');
            setInterventionTypes(res.data.results || res.data);
        } catch (err) {
            toast({ title: "Erreur types", status: "error" });
        }
    };

    useEffect(() => {
        fetchFields();
        fetchTypes();
    }, []);

    // ================= ACTIONS =================
    const handleAdd = () => {
        setSelectedField(null);
        onOpen();
    };

    const handleEdit = (field: any) => {
        setSelectedField(field);
        onOpen();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Supprimer ce champ ?")) return;

        try {
            await api.delete(`/api/v1/field-definitions/${id}/`);
            toast({ title: "Champ supprimé", status: "success" });
            fetchFields();
        } catch (err) {
            toast({ title: "Erreur suppression", status: "error" });
        }
    };

    // ================= LOADING =================
    if (loading) {
        return (
            <Center p={10}>
                <Spinner color="purple.500" />
            </Center>
        );
    }

    // ================= RENDER =================
    return (
        <Box bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">

            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Text fontWeight="bold" fontSize="lg">
                        Champs dynamiques
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                        Configuration des formulaires d'intervention
                    </Text>
                </Box>

                <Button
                    leftIcon={<FiPlus />}
                    colorScheme="purple"
                    size="sm"
                    onClick={handleAdd}
                >
                    Nouveau champ
                </Button>
            </Flex>

            <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                    <Tr>
                        <Th>Type</Th>
                        <Th>Label</Th>
                        <Th>Code</Th>
                        <Th>Champ</Th>
                        <Th>Obligatoire</Th>
                        <Th>Intervention</Th>
                        <Th textAlign="center">Actions</Th>
                    </Tr>
                </Thead>

                <Tbody>
                    {fields.length === 0 ? (
                        <Tr>
                            <Td colSpan={7} textAlign="center" py={10} color="gray.400">
                                Aucun champ configuré
                            </Td>
                        </Tr>
                    ) : (
                        fields.map((field: any) => (
                            <Tr key={field.id} _hover={{ bg: 'gray.50' }}>

                                <Td>
                                    <Badge colorScheme="blue" variant="subtle">
                                        {field.field_type}
                                    </Badge>
                                </Td>

                                <Td fontWeight="bold">
                                    {field.label}
                                </Td>

                                <Td>
                                    <Text fontSize="xs" color="gray.500">
                                        {field.code || "-"}
                                    </Text>
                                </Td>

                                <Td>
                                    <Badge variant="outline">
                                        {field.field_type}
                                    </Badge>
                                </Td>

                                <Td>
                                    <Badge colorScheme={field.required ? "red" : "gray"}>
                                        {field.required ? "Oui" : "Non"}
                                    </Badge>
                                </Td>

                                <Td>
                                    <Text fontSize="xs" color="gray.600">
                                        {field.intervention_type?.name || "-"}
                                    </Text>
                                </Td>

                                <Td>
                                    <HStack justify="center" spacing={2}>
                                        <IconButton
                                            aria-label="edit"
                                            icon={<FiEdit2 />}
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="blue"
                                            onClick={() => handleEdit(field)}
                                        />

                                        <IconButton
                                            aria-label="delete"
                                            icon={<FiTrash2 />}
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => handleDelete(field.id)}
                                        />
                                    </HStack>
                                </Td>

                            </Tr>
                        ))
                    )}
                </Tbody>
            </Table>

            <FieldDefinitionModal
                isOpen={isOpen}
                onClose={onClose}
                fieldData={selectedField}
                interventionTypes={interventionTypes}
                onSuccess={fetchFields}
            />
        </Box>
    );
}