import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    HStack,
    IconButton,
    useToast,
    Spinner,
    Center,
    Text,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Badge,
    Flex,
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import api from '../../api/apiClient';


// ================= TYPES =================

interface FailureReason {
    id: number;
    code: string;
    label: string;
}

interface FormState {
    code: string;
    label: string;
}


// ================= COMPONENT =================

export default function FailureReasonTable() {

    const toast = useToast();

    const [items, setItems] = useState<FailureReason[]>([]);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState<FailureReason | null>(null);

    const [form, setForm] = useState<FormState>({
        code: '',
        label: '',
    });


    // ================= MODALS =================

    const {
        isOpen: isFormOpen,
        onOpen: openForm,
        onClose: closeForm,
    } = useDisclosure();

    const {
        isOpen: isDeleteOpen,
        onOpen: openDelete,
        onClose: closeDelete,
    } = useDisclosure();


    // ================= LOAD DATA =================

    const fetchData = async () => {

        try {

            setLoading(true);

            const res = await api.get('/api/v1/failure-reasons/');

            setItems(res.data.results || res.data || []);

        } catch {

            toast({
                title: 'Erreur chargement',
                status: 'error',
            });

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);


    // ================= OPEN CREATE =================

    const handleCreate = () => {

        setEditing(null);

        setForm({
            code: '',
            label: '',
        });

        openForm();
    };


    // ================= OPEN EDIT =================

    const handleEdit = (item: FailureReason) => {

        setEditing(item);

        setForm({
            code: item.code,
            label: item.label,
        });

        openForm();
    };


    // ================= SAVE =================

    const handleSave = async () => {

        if (!form.code.trim() || !form.label.trim()) {
            toast({
                title: 'Champs requis',
                description: 'Code et label sont obligatoires',
                status: 'warning',
            });
            return;
        }

        try {

            if (editing) {

                await api.put(
                    `/api/v1/failure-reasons/${editing.id}/`,
                    form
                );

                toast({
                    title: 'Mis à jour',
                    status: 'success',
                });

            } else {

                await api.post(
                    `/api/v1/failure-reasons/`,
                    form
                );

                toast({
                    title: 'Créé',
                    status: 'success',
                });
            }

            closeForm();
            fetchData();

        } catch (err: any) {

            toast({
                title: 'Erreur sauvegarde',
                description: err.response?.data?.detail || 'Erreur inconnue',
                status: 'error',
            });
        }
    };


    // ================= DELETE =================

    const [toDelete, setToDelete] = useState<FailureReason | null>(null);

    const handleDelete = async () => {

        if (!toDelete) return;

        try {

            await api.delete(
                `/api/v1/failure-reasons/${toDelete.id}/`
            );

            toast({
                title: 'Supprimé',
                status: 'success',
            });

            closeDelete();
            fetchData();

        } catch {

            toast({
                title: 'Erreur suppression',
                status: 'error',
            });
        }
    };


    // ================= UI =================

    if (loading) {
        return (
            <Center py={10}>
                <Spinner />
            </Center>
        );
    }


    return (
        <Box>

            {/* HEADER */}

            <Flex justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="bold">
                    Causes de panne
                </Text>

                <Button
                    leftIcon={<FiPlus />}
                    colorScheme="purple"
                    onClick={handleCreate}
                >
                    Ajouter
                </Button>
            </Flex>


            {/* TABLE */}

            <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                overflow="hidden"
                bg="white"
            >

                <Table size="sm">

                    <Thead bg="gray.50">
                        <Tr>
                            <Th>Code</Th>
                            <Th>Libellé</Th>
                            <Th width="120px">Actions</Th>
                        </Tr>
                    </Thead>

                    <Tbody>

                        {items.length === 0 ? (
                            <Tr>
                                <Td colSpan={3}>
                                    <Center py={6}>
                                        <Text color="gray.400">
                                            Aucune cause enregistrée
                                        </Text>
                                    </Center>
                                </Td>
                            </Tr>
                        ) : (

                            items.map((item) => (
                                <Tr key={item.id}>

                                    <Td>
                                        <Badge colorScheme="purple">
                                            {item.code}
                                        </Badge>
                                    </Td>

                                    <Td>{item.label}</Td>

                                    <Td>
                                        <HStack spacing={2}>

                                            <IconButton
                                                aria-label="edit"
                                                size="sm"
                                                icon={<FiEdit />}
                                                onClick={() => handleEdit(item)}
                                            />

                                            <IconButton
                                                aria-label="delete"
                                                size="sm"
                                                colorScheme="red"
                                                icon={<FiTrash2 />}
                                                onClick={() => {
                                                    setToDelete(item);
                                                    openDelete();
                                                }}
                                            />

                                        </HStack>
                                    </Td>

                                </Tr>
                            ))

                        )}

                    </Tbody>

                </Table>

            </Box>


            {/* ================= MODAL CREATE/EDIT ================= */}

            <Modal isOpen={isFormOpen} onClose={closeForm} isCentered>

                <ModalOverlay />

                <ModalContent>

                    <ModalHeader>
                        {editing ? 'Modifier cause' : 'Nouvelle cause'}
                    </ModalHeader>

                    <ModalCloseButton />

                    <ModalBody>

                        <VStack spacing={4}>

                            <FormControl isRequired>
                                <FormLabel>Code</FormLabel>
                                <Input
                                    value={form.code}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            code: e.target.value,
                                        })
                                    }
                                    placeholder="ex: POMPE_FAIL"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Libellé</FormLabel>
                                <Input
                                    value={form.label}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            label: e.target.value,
                                        })
                                    }
                                    placeholder="ex: Panne pompe hydraulique"
                                />
                            </FormControl>

                        </VStack>

                    </ModalBody>

                    <ModalFooter>

                        <Button
                            variant="ghost"
                            mr={3}
                            onClick={closeForm}
                        >
                            Annuler
                        </Button>

                        <Button
                            colorScheme="purple"
                            onClick={handleSave}
                        >
                            {editing ? 'Mettre à jour' : 'Créer'}
                        </Button>

                    </ModalFooter>

                </ModalContent>

            </Modal>


            {/* ================= DELETE MODAL ================= */}

            <Modal isOpen={isDeleteOpen} onClose={closeDelete} isCentered>

                <ModalOverlay />

                <ModalContent>

                    <ModalHeader>
                        Confirmation suppression
                    </ModalHeader>

                    <ModalCloseButton />

                    <ModalBody>
                        <Text>
                            Supprimer la cause{' '}
                            <b>{toDelete?.label}</b> ?
                        </Text>
                    </ModalBody>

                    <ModalFooter>

                        <Button
                            variant="ghost"
                            mr={3}
                            onClick={closeDelete}
                        >
                            Annuler
                        </Button>

                        <Button
                            colorScheme="red"
                            onClick={handleDelete}
                        >
                            Supprimer
                        </Button>

                    </ModalFooter>

                </ModalContent>

            </Modal>

        </Box>
    );
}