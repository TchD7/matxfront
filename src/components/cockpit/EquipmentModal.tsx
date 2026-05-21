import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, Input, VStack, HStack, Select, NumberInput, NumberInputField,
    useToast, SimpleGrid
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import api from '../../api/apiClient';

export default function EquipmentModal({ isOpen, onClose, equipment, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);


    const [formData, setFormData] = useState({
        name: '',
        code: '',
        emplacement: '',
        series: '',
        marque: '',
        criticality: 'medium',
        nominal_cycle_time: 0
    });

    // Reset ou remplissage si édition
    useEffect(() => {
        if (equipment) {
            setFormData({
                name: equipment.name || '',
                code: equipment.code || '',
                emplacement: equipment.emplacement || '',
                series: equipment.series || '',
                marque: equipment.marque || '',
                // 2. FIX : 'medium' par défaut si la criticité de l'équipement est absente
                criticality: equipment.criticality || 'medium',
                nominal_cycle_time: equipment.nominal_cycle_time || 0
            });
        } else {
            setFormData({
                name: '', code: '', emplacement: '', series: '',
                // 3. FIX : 'medium' ici aussi pour la remise à zéro
                marque: '', criticality: 'medium', nominal_cycle_time: 0
            });
        }
    }, [equipment, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (equipment) {
                await api.put(`/api/v1/equipments/${equipment.id}/`, formData);
                toast({ title: "Équipement mis à jour", status: "success" });
            } else {
                await api.post('/api/v1/equipments/', formData);
                toast({ title: "Équipement créé", status: "success" });
            }
            onSuccess();
            onClose();
        } catch (err) {
            toast({ title: "Erreur lors de l'enregistrement", status: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>{equipment ? 'Modifier' : 'Ajouter'} un Équipement</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4}>
                        <SimpleGrid columns={2} spacing={4} w="full">
                            <FormControl isRequired>
                                <FormLabel>Désignation / Nom</FormLabel>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ex: Transformateur T1"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Code Interne</FormLabel>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="ex: EQ-2024-001"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Marque</FormLabel>
                                <Input
                                    value={formData.marque}
                                    onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                                    placeholder="ex: Schneider Electric"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Numéro de Série</FormLabel>
                                <Input
                                    value={formData.series}
                                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Emplacement / Site</FormLabel>
                                <Input
                                    value={formData.emplacement}
                                    onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Criticité</FormLabel>
                                <Select
                                    value={formData.criticality}
                                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                                >
                                    <option value="low">Basse</option>
                                    <option value="medium">Moyenne</option>
                                    <option value="high">Haute</option>
                                    <option value="critical">Critique</option>
                                </Select>
                            </FormControl>
                        </SimpleGrid>

                        <FormControl>
                            <FormLabel>Temps de Cycle Nominal (sec)</FormLabel>
                            <NumberInput
                                min={0}
                                value={formData.nominal_cycle_time}
                                onChange={(_, val) => setFormData({ ...formData, nominal_cycle_time: val })}
                            >
                                <NumberInputField />
                            </NumberInput>
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
                    <Button colorScheme="purple" type="submit" isLoading={loading}>
                        Enregistrer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}