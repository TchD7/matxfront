import {
    Box, Button, Flex, FormControl, FormLabel, Input, Table, Thead, Tbody,
    Tr, Th, Td, IconButton, useToast, Spinner, Center, Heading, Modal,
    ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
    ModalCloseButton, useDisclosure, VStack, Text, HStack, Link
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, DownloadIcon, UpDownIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import api from '../../api/apiClient'; // Ton instance Axios

interface Consumable {
    id: string | number;
    name: string;
    unit: string;
}

export default function ConsumablesTable() {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [consumables, setConsumables] = useState<Consumable[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
    const [formData, setFormData] = useState({ name: '', unit: '' });

    const fetchConsumables = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/v1/consumables/');
            // S'adapte si DRF renvoie une pagination { results: [...] } ou un tableau brut
            setConsumables(res.data.results || res.data);
        } catch (err) {
            toast({ title: "Erreur", description: "Impossible de charger les consommables.", status: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConsumables(); }, []);

    // ================= EXPORT EXCEL =================
    const handleExportExcel = async () => {
        try {
            setExcelLoading(true);
            // Crucial : 'blob' permet de recevoir un fichier binaire (le .xlsx de Django)
            const response = await api.get('/api/v1/consumables/export-excel/', { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'catalogue_consommables.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast({ title: "Erreur d'export", description: "Impossible de générer le fichier Excel.", status: "error" });
        } finally {
            setExcelLoading(false);
        }
    };

    // ================= IMPORT EXCEL =================
    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formDataFile = new FormData();
        formDataFile.append('file', file);

        try {
            setExcelLoading(true);
            await api.post('/api/v1/consumables/import-excel/', formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Importation réussie", status: "success", duration: 3000 });
            fetchConsumables(); // On recharge le tableau actualisé !
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Le fichier Excel est mal formé ou invalide.";
            toast({ title: "Échec de l'importation", description: errorMsg, status: "error", duration: 5000 });
        } finally {
            setExcelLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset de l'input file
        }
    };

    // ================= STANDARD CRUD =================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (selectedConsumable) {
                await api.put(`/api/v1/consumables/${selectedConsumable.id}/`, formData);
                toast({ title: "Mis à jour avec succès", status: "success" });
            } else {
                await api.post('/api/v1/consumables/', formData);
                toast({ title: "Créé avec succès", status: "success" });
            }
            onClose();
            fetchConsumables();
        } catch (err) {
            toast({ title: "Erreur de sauvegarde", status: "error" });
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm("Supprimer ce consommable ?")) return;
        try {
            await api.delete(`/api/v1/consumables/${id}/`);
            toast({ title: "Supprimé", status: "success" });
            fetchConsumables();
        } catch (err) {
            toast({ title: "Suppression impossible", description: "Cet article est lié à l'historique d'un ticket.", status: "error" });
        }
    };

    if (loading) return <Center py={20}><Spinner color="purple.500" size="xl" /></Center>;

    return (
        <Box p={6} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.100" shadow="sm">

            {/* Barre d'outils du catalogue */}
            <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
                <VStack align="flex-start" spacing={1}>
                    <Heading size="md" color="gray.700">Catalogue des Consommables</Heading>
                    <Text fontSize="xs" color="gray.500">Gérez la liste de pièces de rechange et matériels consommés</Text>
                </VStack>

                <HStack spacing={3}>
                    {/* Input caché pour l'import Excel */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleImportExcel}
                    />
                    <Button
                        leftIcon={<UpDownIcon />}
                        variant="outline"
                        colorScheme="green"
                        size="sm"
                        isLoading={excelLoading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Importer Excel
                    </Button>
                    <Button
                        leftIcon={<DownloadIcon />}
                        variant="outline"
                        colorScheme="blue"
                        size="sm"
                        isLoading={excelLoading}
                        onClick={handleExportExcel}
                    >
                        Exporter la table
                    </Button>
                    <Button
                        leftIcon={<AddIcon />}
                        colorScheme="purple"
                        size="sm"
                        onClick={() => { setSelectedConsumable(null); setFormData({ name: '', unit: '' }); onOpen(); }}
                    >
                        Ajouter un article
                    </Button>
                </HStack>
            </Flex>

            {/* Tableau principal */}
            {consumables.length === 0 ? (
                <Center py={10} bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.200">
                    <Text color="gray.500" fontSize="sm">Aucun consommable enregistré.</Text>
                </Center>
            ) : (
                <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th color="gray.600">Nom de l'article</Th>
                                <Th color="gray.600">Unité</Th>
                                <Th color="gray.600" width="100px" textAlign="center">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {consumables.map((item) => (
                                <Tr key={item.id}>
                                    <Td fontWeight="medium" color="gray.700">{item.name}</Td>
                                    <Td><Text px={2} py={0.5} bg="purple.50" color="purple.700" borderRadius="md" display="inline-block" fontSize="xs" fontWeight="bold">{item.unit}</Text></Td>
                                    <Td>
                                        <HStack spacing={2} justify="center">
                                            <IconButton aria-label="Edit" icon={<EditIcon />} size="xs" colorScheme="blue" variant="ghost" onClick={() => { setSelectedConsumable(item); setFormData({ name: item.name, unit: item.unit }); onOpen(); }} />
                                            <IconButton aria-label="Delete" icon={<DeleteIcon />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDelete(item.id)} />
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            )}

            {/* Modal CRUD */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleSubmit}>
                    <ModalHeader fontSize="md">{selectedConsumable ? "✏️ Modifier" : "➕ Ajouter un article"}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={4}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">Désignation</FormLabel>
                                <Input placeholder="Ex: Câble RJ45 Cat6..." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">Unité de mesure</FormLabel>
                                <Input placeholder="Ex: Mètre, Unité..." value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter bg="gray.50" gap={2}>
                        <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
                        <Button colorScheme="purple" size="sm" type="submit" isLoading={submitting}>Enregistrer</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}