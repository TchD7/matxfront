import { useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
    ModalCloseButton, Button, FormControl, FormLabel, Input, Switch,
    VStack, Box, useToast, Select, RadioGroup, Radio, Stack, Text
} from '@chakra-ui/react';
import api from '../../../api/apiClient';

// Imports stricts depuis vos constantes globales
import type { BuilderField, ConditionGroup } from './constants';

// --- COMPOSANT AUTONOME : ÉDITEUR SIMPLIFIÉ DE CHECKPOINT POUR SECTIONS ---

interface SectionConditionEditorProps {
    visibilityType: 'always' | 'checkpoint';
    setVisibilityType: (type: 'always' | 'checkpoint') => void;
    selectedCheckpointId: number | string | null;
    setSelectedCheckpointId: (id: number | string | null) => void;
    availableFields: BuilderField[];
}

const SectionConditionEditor = ({
    visibilityType,
    setVisibilityType,
    selectedCheckpointId,
    setSelectedCheckpointId,
    availableFields
}: SectionConditionEditorProps) => {

    // Filtrage strict : on ne conserve que les champs de type "checkpoint"
    const checkpointFields = (availableFields || []).filter(
        field => field.field_type === 'checkpoint' || (field as any).type === 'checkpoint'
        
    );

    return (
        <Box border="1px solid" borderColor="gray.200" p={4} borderRadius="md" bg="gray.50/50">
            <FormControl>
                <FormLabel fontWeight="bold" color="gray.700" mb={3}>
                    Condition de visibilité
                </FormLabel>

                <RadioGroup
                    onChange={(val) => {
                        setVisibilityType(val as 'always' | 'checkpoint');
                        if (val === 'always') setSelectedCheckpointId(null);
                    }}
                    value={visibilityType}
                    colorScheme="purple"
                >
                    <Stack spacing={3}>
                        <Radio value="always">
                            <Text fontSize="sm">Toujours visible</Text>
                        </Radio>

                        <Radio value="checkpoint">
                            <Text fontSize="sm">Visible uniquement lorsque le checkpoint suivant est validé</Text>
                        </Radio>
                    </Stack>
                </RadioGroup>
            </FormControl>

            {visibilityType === 'checkpoint' && (
                <FormControl isRequired mt={4} borderTop="1px dashed" borderColor="gray.200" pt={3}>
                    <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">
                        Checkpoint :
                    </FormLabel>
                    <Select
                        bg="white"
                        placeholder="Sélectionner un checkpoint"
                        value={selectedCheckpointId || ''}
                        onChange={(e) => setSelectedCheckpointId(e.target.value || null)}
                    >
                        {checkpointFields.length === 0 ? (
                            <option disabled>Aucun checkpoint disponible dans ce formulaire</option>
                        ) : (
                            checkpointFields.map(field => (
                                <option key={field.id} value={field.id}>
                                    {field.label || field.code}
                                </option>
                            ))
                        )}
                    </Select>
                </FormControl>
            )}
        </Box>
    );
};


// --- COMPOSANT PRINCIPAL : SECTION MODAL ---

export interface SectionData {
    id?: number | string;
    title?: string;
    code?: string;
    description?: string;
    is_active?: boolean;
    visibility_condition_group?: number | null;
    visibility_condition_group_detail?: ConditionGroup | null;
}

export interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    formVersionId: number | string;
    fieldData?: SectionData | null;
    availableFields: BuilderField[];
    onSuccess: () => void;
}

export const SectionModal = ({
    isOpen,
    onClose,
    formVersionId,
    fieldData,
    availableFields,
    onSuccess
}: SectionModalProps) => {
    const toast = useToast();
    const [loading, setLoading] = useState<boolean>(false);

    // 📦 Section States
    const [title, setTitle] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);

    // 🧠 Condition States (Spécifiques au métier simplifié des sections)
    const [visibilityType, setVisibilityType] = useState<'always' | 'checkpoint'>('always');
    const [selectedCheckpointId, setSelectedCheckpointId] = useState<number | string | null>(null);

    // Initialisation & Remplissage en mode Édition
    useEffect(() => {
        if (!isOpen) return;

        if (fieldData) {
            setTitle(fieldData.title || '');
            setCode(fieldData.code || '');
            setDescription(fieldData.description || '');
            setIsActive(fieldData.is_active !== false);

            const groupDetail = fieldData.visibility_condition_group_detail;

            // Extraction de la condition unique si elle existe
            if (groupDetail && groupDetail.conditions && groupDetail.conditions.length > 0) {
                const firstCondition = groupDetail.conditions[0];
                setVisibilityType('checkpoint');
                setSelectedCheckpointId(firstCondition.field_definition || null);
            } else {
                resetConditionState();
            }
        } else {
            setTitle('');
            setCode('');
            setDescription('');
            setIsActive(true);
            resetConditionState();
        }
    }, [isOpen, fieldData]);

    const resetConditionState = () => {
        setVisibilityType('always');
        setSelectedCheckpointId(null);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Résolution dynamique de l'ID du groupe existant (évite un state Redux ou local supplémentaire)
            let conditionGroupId: number | null = fieldData?.visibility_condition_group_detail?.id ||
                (typeof fieldData?.visibility_condition_group === 'number' ? fieldData.visibility_condition_group : null);

            // 1. Branchement Conditionnelle : Reconstruction transparente du schéma d'API
            if (visibilityType === 'checkpoint' && selectedCheckpointId) {
                const groupPayload = {
                    trigger: 'visibility',
                    operator: 'AND', // Fixé par défaut à l'implémentation
                    form_version: formVersionId,
                    conditions: [
                        {
                            field_definition: Number(selectedCheckpointId),
                            operator: 'eq', // Toujours "égal à" pour la validation de checkpoint
                            value: true     // Validé implique 'true'
                        }
                    ]
                };

                if (conditionGroupId) {
                    await api.put(`/api/v1/condition-groups/${conditionGroupId}/`, groupPayload);
                } else {
                    const groupRes = await api.post('/api/v1/condition-groups/', groupPayload);
                    conditionGroupId = groupRes.data.id;
                }
            } else {
                // Si "Toujours visible", on détache complètement le groupe
                conditionGroupId = null;
            }

            // 2. Payload final de sauvegarde de la Section
            const sectionPayload = {
                title,
                code,
                description,
                is_active: isActive,
                form_version: formVersionId,
                visibility_condition_group: conditionGroupId
            };

            if (fieldData?.id) {
                await api.put(`/api/v1/sections/${fieldData.id}/`, sectionPayload);
            } else {
                await api.post('/api/v1/sections/', sectionPayload);
            }

            toast({
                title: 'Succès',
                description: 'Section enregistrée avec succès',
                status: 'success'
            });
            onSuccess();
            onClose();
        } catch (e: unknown) {
            console.error(e);
            const errorMessage = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
                || "Une erreur est survenue lors de l'enregistrement";
            toast({
                title: 'Erreur',
                description: errorMessage,
                status: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{fieldData ? 'Modifier la section' : 'Nouvelle section'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel>Titre de la section</FormLabel>
                            <Input value={title} onChange={(e) => {
                                const newTitle = e.target.value;
                                setTitle(newTitle);
                                if (!fieldData) {
                                    setCode(newTitle.toLowerCase()
                                        .normalize("NFD")
                                        .replace(/[\u0300-\u036f]/g, "")
                                        .trim()
                                        .replace(/\s+/g, '_')
                                        .replace(/[^a-z0-9_]/g, ''));
                                }
                            }} placeholder="Ex: Spécifications Techniques" />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Code technique</FormLabel>
                            <Input value={code} onChange={(e) => setCode(e.target.value)} isReadOnly={!!fieldData} bg={fieldData ? "gray.50" : "white"} />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description (optionnel)</FormLabel>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Aide pour l'utilisateur..." />
                        </FormControl>

                        <FormControl display="flex" alignItems="center" justifyContent="space-between" pb={2}>
                            <FormLabel mb={0}>Section active</FormLabel>
                            <Switch isChecked={isActive} onChange={(e) => setIsActive(e.target.checked)} colorScheme="purple" />
                        </FormControl>

                        {/* Intégration directe du nouvel éditeur métier ultra-simplifié */}
                        <SectionConditionEditor
                            visibilityType={visibilityType}
                            setVisibilityType={setVisibilityType}
                            selectedCheckpointId={selectedCheckpointId}
                            setSelectedCheckpointId={setSelectedCheckpointId}
                            availableFields={availableFields}
                        />

                    </VStack>
                </ModalBody>
                <ModalFooter borderTop="1px solid" borderColor="gray.100">
                    <Button variant="ghost" onClick={onClose} mr={3}>Annuler</Button>
                    <Button colorScheme="purple" onClick={handleSubmit} isLoading={loading}>Sauvegarder</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};