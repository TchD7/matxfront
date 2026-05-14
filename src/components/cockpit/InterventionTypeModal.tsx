import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, Input, Textarea, VStack, useToast, Switch, HStack, Text
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import api from '../../api/apiClient';

export default function InterventionTypeModal({ isOpen, onClose, typeData, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        fields: '', // On va le gérer comme une chaîne JSON pour l'édition
        is_active: true
    });

    useEffect(() => {
        if (typeData) {
            setFormData({
                name: typeData.name || '',
                description: typeData.description || '',
                // Si fields est un objet, on le stringify pour le textarea
                fields: typeData.fields ? JSON.stringify(typeData.fields, null, 2) : '',
                is_active: typeData.is_active ?? true
            });
        } else {
            setFormData({ name: '', description: '', fields: '', is_active: true });
        }
    }, [typeData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation du JSON pour le champ 'fields'
        let processedFields = null;
        if (formData.fields.trim() !== '') {
            try {
                processedFields = JSON.parse(formData.fields);
            } catch (err) {
                toast({ title: "Format JSON invalide pour les champs", status: "error" });
                setLoading(false);
                return;
            }
        }

        const payload = { ...formData, fields: processedFields };

        try {
            if (typeData) {
                await api.put(`/api/v1/intervention-types/${typeData.id}/`, payload);
                toast({ title: "Type mis à jour", status: "success" });
            } else {
                await api.post('/api/v1/intervention-types/', payload);
                toast({ title: "Type créé", status: "success" });
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
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>{typeData ? 'Modifier le type' : 'Nouveau type'}</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4} align="start">
                        <HStack w="full" justify="space-between">
                            <FormControl display="flex" alignItems="center">
                                <FormLabel mb="0">Actif ?</FormLabel>
                                <Switch
                                    colorScheme="purple"
                                    isChecked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            </FormControl>
                        </HStack>

                        <FormControl isRequired>
                            <FormLabel>Nom de la catégorie</FormLabel>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="ex: Maintenance Préventive"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </FormControl>


                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button colorScheme="purple" type="submit" isLoading={loading}>
                        Enregistrer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}