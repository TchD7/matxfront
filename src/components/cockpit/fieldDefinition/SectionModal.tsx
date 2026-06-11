import { useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
    ModalCloseButton, Button, FormControl, FormLabel, Input, Switch,
    VStack, Box, useToast, HStack, Heading
} from '@chakra-ui/react';
import api from '../../../api/apiClient';

export const SectionModal = ({
    isOpen, onClose, interventionTypeId, formVersionId, fieldData, onSuccess
}: any) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // 📦 Section States
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    // 🧠 Condition States (Liés au ConditionGroup)
    const [hasSectionCondition, setHasSectionCondition] = useState(false);
    const [targetField, setTargetField] = useState(''); // ex: brasseries_checked
    const [expectedValue, setExpectedValue] = useState('true'); // default: true
    const [existingGroupId, setExistingGroupId] = useState<number | null>(null);

    // Initialisation des données (Mode Édition / Création)
    useEffect(() => {
        if (!isOpen) return;
        if (fieldData) {
            setTitle(fieldData.title || '');
            setCode(fieldData.code || '');
            setDescription(fieldData.description || '');
            setIsActive(fieldData.is_active !== false);

            // Si la section a déjà un groupe de condition lié
            if (fieldData.visibility_condition_group_detail) {
                setHasSectionCondition(true);
                setExistingGroupId(fieldData.visibility_condition_group_detail.id);
                setTargetField(fieldData.visibility_condition_group_detail.target_field || '');
                setExpectedValue(fieldData.visibility_condition_group_detail.expected_value || 'true');
            } else if (fieldData.visibility_condition_group) {
                // Fallback si seul l'ID est fourni au début
                setHasSectionCondition(true);
                setExistingGroupId(fieldData.visibility_condition_group);
                // Il faudra idéalement fetcher le groupe ou l'avoir dans le serializer d'édition
            } else {
                resetConditionFields();
            }
        } else {
            setTitle('');
            setCode('');
            setDescription('');
            setIsActive(true);
            resetConditionFields();
        }
    }, [isOpen, fieldData]);

    const resetConditionFields = () => {
        setHasSectionCondition(false);
        setTargetField('');
        setExpectedValue('true');
        setExistingGroupId(null);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let conditionGroupId = existingGroupId;

            // 🚀 1. GESTION DU CONDITION GROUP (CREATION OU MISE A JOUR)
            if (hasSectionCondition) {
                const groupPayload = {
                    name: `Condition Visibilité - ${title || code}`,
                    form_version: formVersionId,
                    trigger: 'visibility',
                    target_field: targetField,
                    expected_value: expectedValue
                };

                if (conditionGroupId) {
                    // Si le groupe existe déjà, on le met à jour
                    await api.put(`/api/v1/condition-groups/${conditionGroupId}/`, groupPayload);
                } else {
                    // Sinon, on crée le "champ magique" en premier
                    const groupRes = await api.post('/api/v1/condition-groups/', groupPayload);
                    conditionGroupId = groupRes.data.id;
                }
            } else if (conditionGroupId) {
                // Si l'utilisateur a décoché la condition alors qu'il y en avait une avant,
                // on optionnalise la suppression ou on détache simplement (ici on va juste détacher).
                conditionGroupId = null;
            }

            // 📦 2. SOUUMISSION DE LA SECTION
            const sectionPayload = {
                title,
                code,
                description,
                is_active: isActive,
                intervention_type: interventionTypeId,
                form_version: formVersionId,
                visibility_condition_group: conditionGroupId // ID du groupe créé/existant
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
        } catch (e: any) {
            console.error(e);
            toast({
                title: 'Erreur',
                description: e.response?.data?.detail || "Une erreur est survenue lors de l'enregistrement",
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
                        {/* Information de la section */}
                        <FormControl isRequired>
                            <FormLabel>Titre de la section</FormLabel>
                            <Input value={title} onChange={(e) => {
                                setTitle(e.target.value);
                                if (!fieldData) {
                                    setCode(e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
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

                        {/* --- BLOC CONDITION DU CHECKPOINT --- */}
                        <Box border="1px solid" borderColor="purple.200" p={4} borderRadius="md" bg="purple.50/30">
                            <FormControl display="flex" justifyContent="space-between" alignItems="center">
                                <FormLabel mb={0} fontWeight="semibold" color="purple.700">
                                    Condition de visibilité (Checkpoint)
                                </FormLabel>
                                <Switch isChecked={hasSectionCondition} onChange={(e) => setHasSectionCondition(e.target.checked)} colorScheme="purple" />
                            </FormControl>

                            {hasSectionCondition && (
                                <VStack spacing={3} mt={4} align="stretch" borderTop="1px dashed" borderColor="purple.200" pt={3}>
                                    <Heading size="xs" color="gray.600">Configuration du déclencheur</Heading>

                                    <HStack spacing={4}>
                                        <FormControl isRequired>
                                            <FormLabel fontSize="sm">Code du champ cible (Target Field)</FormLabel>
                                            <Input
                                                bg="white"
                                                value={targetField}
                                                onChange={(e) => setTargetField(e.target.value)}
                                                placeholder="Ex: brasseries_checked"
                                            />
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel fontSize="sm">Valeur attendue (Expected Value)</FormLabel>
                                            <Input
                                                bg="white"
                                                value={expectedValue}
                                                onChange={(e) => setExpectedValue(e.target.value)}
                                                placeholder="Ex: true, oui, 1"
                                            />
                                        </FormControl>
                                    </HStack>
                                </VStack>
                            )}
                        </Box>
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