import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel, Input, Textarea, useToast, VStack
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import api from '../../api/apiClient';

interface FieldDefinitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'section' | 'field';
    interventionTypeId: string | number;
    currentSectionsCount: number; // Passé par le parent pour calculer l'ordre
    onSuccess: () => void;
}

// Fonction utilitaire pour générer un slug propre (pour le champ code)
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Supprime les accents
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s_-]/g, '') // Supprime les caractères spéciaux
        .replace(/[\s_-]+/g, '_') // Remplace les espaces et tirets par des underscores
        .trim();
};

export default function FieldDefinitionModal({
    isOpen,
    onClose,
    mode,
    interventionTypeId,
    currentSectionsCount,
    onSuccess
}: FieldDefinitionModalProps) {

    const toast = useToast();
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Réinitialise les champs à l'ouverture
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setCode('');
            setDescription('');
        }
    }, [isOpen]);

    // Génère le code API / Slug automatiquement quand le titre change
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        setCode(slugify(val));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !code.trim()) {
            toast({ title: "Le titre et le code sont requis", status: "warning", duration: 2000 });
            return;
        }

        try {
            setIsLoading(true);

            if (mode === 'section') {
                // Payload calqué exactement sur ton modèle Django
                await api.post('/api/v1/sections/', {
                    intervention_type: interventionTypeId,
                    title: title.trim(),
                    code: code.trim(),
                    description: description.trim() || null,
                    order: currentSectionsCount + 1, // Gestion de la contrainte unique_section_order_per_type
                    is_active: true
                });

                toast({ title: "Section créée avec succès !", status: "success", duration: 3000 });
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            // Extraction des erreurs de contraintes uniques de Django
            const backendError = err.response?.data;
            let errorMsg = "Erreur lors de l'enregistrement.";

            if (backendError && typeof backendError === 'object') {
                const firstKey = Object.keys(backendError)[0];
                errorMsg = `${firstKey} : ${JSON.stringify(backendError[firstKey])}`;
            }

            toast({ title: "Échec de la création", description: errorMsg, status: "error", duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit} borderRadius="xl">
                <ModalHeader fontSize="md" fontWeight="bold">
                    {mode === 'section' ? '➕ Nouvelle Section d\'intervention' : 'Créer un paramètre'}
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody pb={4}>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.600">Nom de la section</FormLabel>
                            <Input
                                value={title}
                                onChange={handleTitleChange}
                                placeholder="Ex: État des pneumatiques"
                                focusBorderColor="purple.400"
                                size="sm"
                                borderRadius="md"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.600">Code API (Slug unique)</FormLabel>
                            <Input
                                value={code}
                                onChange={(e) => setCode(slugify(e.target.value))}
                                placeholder="ex: etat_des_pneumatiques"
                                focusBorderColor="purple.400"
                                size="sm"
                                borderRadius="md"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.600">Description (Optionnelle)</FormLabel>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Précisez l'objectif de cette section..."
                                focusBorderColor="purple.400"
                                size="sm"
                                borderRadius="md"
                                rows={3}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter bg="gray.50" borderBottomRadius="xl" gap={2}>
                    <Button size="sm" variant="ghost" onClick={onClose} isDisabled={isLoading}>
                        Annuler
                    </Button>
                    <Button size="sm" colorScheme="purple" type="submit" isLoading={isLoading}>
                        Créer la section
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}