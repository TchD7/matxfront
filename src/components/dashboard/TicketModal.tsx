import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Select,
    VStack,
    Switch,
    Flex,
    Text,
    useToast,
    Spinner,
    Center,
} from '@chakra-ui/react';

import { useState, useEffect } from 'react';
import api from '../../api/apiClient';

// --- INTERFACES ---
interface Equipment {
    id: string; // UUID = string
    name: string;
    code: string;
}

interface InterventionType {
    id: number; // ID simple = number
    name: string;
}

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TicketModal({
    isOpen,
    onClose,
    onSuccess,
}: TicketModalProps) {

    const toast = useToast();

    // =========================================================
    // STATES
    // =========================================================
    const [loading, setLoading] = useState(false);
    const [referencesLoading, setReferencesLoading] = useState(false);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);

    const [formData, setFormData] = useState({
        equipment_id: '',
        intervention_type_id: '',
        is_breakdown: false,
    });

    // =========================================================
    // CHARGEMENT DES DONNÉES
    // =========================================================
    const fetchReferences = async () => {
        try {
            setReferencesLoading(true);
            const [equipmentRes, interventionRes] = await Promise.all([
                api.get('/api/v1/equipments/'),
                api.get('/api/v1/intervention-types/'),
            ]);

            // On s'assure de récupérer les tableaux de données
            setEquipments(equipmentRes.data.results || equipmentRes.data || []);
            setInterventionTypes(interventionRes.data.results || interventionRes.data || []);
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les équipements ou types',
                status: 'error',
            });
        } finally {
            setReferencesLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchReferences();
            setFormData({
                equipment_id: '',
                intervention_type_id: '',
                is_breakdown: false,
            });
        }
    }, [isOpen]);

    // =========================================================
    // SOUMISSION DU FORMULAIRE
    // =========================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION : Si la valeur est vide (placeholder), on bloque.
        if (!formData.equipment_id || formData.equipment_id === "") {
            toast({
                title: "Sélection requise",
                description: "Veuillez sélectionner un équipement dans la liste.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // PRÉPARATION DU PAYLOAD
        const payload = {
            // IMPORTANT: equipment_id reste une STRING (UUID)
            equipment_id: formData.equipment_id,

            // intervention_type_id est converti en NOMBRE (car tes IDs types sont 1, 2...)
            intervention_type_id: formData.intervention_type_id
                ? Number(formData.intervention_type_id)
                : null,

            is_breakdown: formData.is_breakdown,
        };

        console.log("Données envoyées au serveur :", payload);

        try {
            setLoading(true);
            await api.post('/api/v1/tickets/', payload);

            toast({ title: 'Ticket créé avec succès', status: 'success' });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Erreur API :", error.response?.data);
            toast({
                title: 'Erreur ' + (error.response?.status || ''),
                description: error.response?.data?.detail || "Vérifiez que l'équipement sélectionné est valide.",
                status: 'error',
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // UI
    // =========================================================
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <form onSubmit={handleSubmit}>
                <ModalContent>
                    <ModalHeader>Nouvelle intervention</ModalHeader>
                    <ModalCloseButton />

                    <ModalBody>
                        {referencesLoading ? (
                            <Center py={10}><Spinner color="purple.500" /></Center>
                        ) : (
                            <VStack spacing={5}>

                                {/* SELECT EQUIPEMENT */}
                                <FormControl isRequired>
                                    <FormLabel>Equipement</FormLabel>
                                    <Select
                                        placeholder="Choisir un équipement"
                                        value={formData.equipment_id}
                                        onChange={(e) =>
                                            // ON NE MET PAS DE parseInt ICI POUR L'UUID
                                            setFormData({ ...formData, equipment_id: e.target.value })
                                        }
                                    >
                                        {equipments.map((eq) => (
                                            <option key={eq.id} value={eq.id}>
                                                {eq.name} ({eq.code})
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* SELECT TYPE INTERVENTION */}
                                <FormControl>
                                    <FormLabel>Type d'intervention</FormLabel>
                                    <Select
                                        placeholder="Optionnel"
                                        value={formData.intervention_type_id}
                                        onChange={(e) =>
                                            setFormData({ ...formData, intervention_type_id: e.target.value })
                                        }
                                    >
                                        {interventionTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* SWITCH PANNE */}
                                <Flex
                                    w="full"
                                    justify="space-between"
                                    align="center"
                                    p={4}
                                    border="1px solid"
                                    borderColor="gray.100"
                                    borderRadius="lg"
                                >
                                    <Text fontWeight="medium">Intervention de panne</Text>
                                    <Switch
                                        colorScheme="purple"
                                        isChecked={formData.is_breakdown}
                                        onChange={(e) =>
                                            setFormData({ ...formData, is_breakdown: e.target.checked })
                                        }
                                    />
                                </Flex>
                            </VStack>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Annuler
                        </Button>
                        <Button
                            colorScheme="purple"
                            type="submit"
                            isLoading={loading}
                        >
                            Créer le ticket
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </form>
        </Modal>
    );
}