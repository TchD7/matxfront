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
    Input,
    Textarea,
    VStack,
    useToast,
    Switch,
    HStack,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Divider,
    Box,
    Select,
    Text,
    Heading,
    IconButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiTrash2, FiPlus } from 'react-icons/fi';
import api from '../../api/apiClient';

/* ============================================================================
   TYPES & INTERFACES (Alignés sur Django)
============================================================================ */
interface Condition {
    id?: string | number;
    field_definition: string | number; // ID du champ à surveiller
    operator: string;                  // eq, neq, gt, contains, etc.
    value: any;                        // Correspond à ton JSONField (param_2)
}

interface ConditionGroup {
    name: string;
    trigger: 'visibility' | 'enabled' | 'readonly' | 'required';
    operator: 'AND' | 'OR';
    conditions: Condition[];
}

interface SectionData {
    id?: string | number;
    title: string;
    code: string;
    description?: string;
    order: number;
    is_active: boolean;
    intervention_type?: string | number;
    visibility_condition_group?: ConditionGroup | null;
}

interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    interventionTypeId: string | number;
    sectionData: SectionData | null;
    onSuccess: () => void;
}

// Opérateurs de conditions du modèle Django
const BACKEND_OPERATORS = [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '!=' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
    { value: 'contains', label: 'contient' },
    { value: 'checked', label: 'coché' },
    { value: 'in', label: 'dans' },
    { value: 'not_in', label: 'pas dans' },
    { value: 'is_empty', label: 'est vide' },
    { value: 'not_empty', label: 'n\'est pas vide' },
];

const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '_');
};

/* ============================================================================
   MAIN COMPONENT
============================================================================ */
export default function SectionModal({
    isOpen,
    onClose,
    interventionTypeId,
    sectionData,
    onSuccess
}: SectionModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Liste globale des champs de ce type d'intervention pour bâtir les conditions
    const [availableFields, setAvailableFields] = useState<any[]>([]);

    // États du formulaire de base
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        order: 1,
        is_active: true
    });

    // État dédié au système d'affichage conditionnel (ConditionGroup)
    const [hasConditions, setHasConditions] = useState(false);
    const [conditionGroup, setConditionGroup] = useState<ConditionGroup>({
        name: '',
        trigger: 'visibility',
        operator: 'AND',
        conditions: []
    });

    // 1. Chargement des champs disponibles pour créer des liaisons de conditions
    useEffect(() => {
        const fetchFields = async () => {
            try {
                // Endpoint à adapter selon ton routage (récupère les champs du type d'intervention)
                const res = await api.get(`/api/v1/field-definitions/?intervention_type=${interventionTypeId}`);
                setAvailableFields(res.data || []);
            } catch (err) {
                console.error("Erreur lors de la récupération des champs parents", err);
            }
        };

        if (isOpen && interventionTypeId) {
            fetchFields();
        }
    }, [isOpen, interventionTypeId]);

    // 2. Synchronisation des données à l'ouverture (Mode édition ou création)
    useEffect(() => {
        if (isOpen) {
            setDeleteConfirm(false);
            if (sectionData) {
                setFormData({
                    title: sectionData.title || '',
                    code: sectionData.code || '',
                    description: sectionData.description || '',
                    order: sectionData.order ?? 1,
                    is_active: sectionData.is_active ?? true
                });

                // Si un groupe de conditions existe déjà sur la section
                if (sectionData.visibility_condition_group) {
                    setHasConditions(true);
                    setConditionGroup({
                        name: sectionData.visibility_condition_group.name || '',
                        trigger: sectionData.visibility_condition_group.trigger || 'visibility',
                        operator: sectionData.visibility_condition_group.operator || 'AND',
                        conditions: sectionData.visibility_condition_group.conditions || []
                    });
                } else {
                    setHasConditions(false);
                    setConditionGroup({ name: '', trigger: 'visibility', operator: 'AND', conditions: [] });
                }
            } else {
                // Reset complet pour création
                setFormData({ title: '', code: '', description: '', order: 1, is_active: true });
                setHasConditions(false);
                setConditionGroup({ name: '', trigger: 'visibility', operator: 'AND', conditions: [] });
            }
        }
    }, [sectionData, isOpen]);

    const handleClose = () => {
        setDeleteConfirm(false);
        onClose();
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const titleValue = e.target.value;
        setFormData(prev => ({
            ...prev,
            title: titleValue,
            code: sectionData ? prev.code : slugify(titleValue)
        }));
    };

    /* ============================================================================
       LOGIQUE INTERNE DU MOTEUR DE CONDITIONS
    ============================================================================ */
    const addCondition = () => {
        setConditionGroup(prev => ({
            ...prev,
            conditions: [
                ...prev.conditions,
                { field_definition: '', operator: 'eq', value: '' }
            ]
        }));
    };

    const updateCondition = (index: number, key: keyof Condition, val: any) => {
        setConditionGroup(prev => {
            const updated = [...prev.conditions];
            updated[index] = { ...updated[index], [key]: val };
            return { ...prev, conditions: updated };
        });
    };

    const removeCondition = (index: number) => {
        setConditionGroup(prev => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index)
        }));
    };

    /* ============================================================================
       SOUMISSION (POST / PUT) AVEC PAYLOAD IMBRIQUÉ
    ============================================================================ */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Construction du payload aligné sur tes modèles Django
        const payload: any = {
            intervention_type: interventionTypeId,
            title: formData.title.trim(),
            code: formData.code.trim(),
            description: formData.description.trim(),
            order: formData.order,
            is_active: formData.is_active,
            // Injection conditionnelle du groupe de conditions
            visibility_condition_group: hasConditions ? {
                name: conditionGroup.name || `Règles section ${formData.title}`,
                trigger: conditionGroup.trigger,
                operator: conditionGroup.operator,
                conditions: conditionGroup.conditions.map(c => ({
                    field_definition: parseInt(c.field_definition as string),
                    operator: c.operator,
                    value: c.value // Reçu en JSONField côté backend
                }))
            } : null
        };

        try {
            if (sectionData?.id) {
                await api.put(`/api/v1/sections/${sectionData.id}/`, payload);
                toast({ title: "Section et règles enregistrées !", status: "success", duration: 3000 });
            } else {
                await api.post('/api/v1/sections/', payload);
                toast({ title: "Nouvelle section créée avec succès", status: "success", duration: 3000 });
            }
            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Erreur lors de la sauvegarde",
                description: err.response?.data?.detail || "Vérifiez la configuration de vos critères d'affichage.",
                status: "error",
                duration: 5000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!sectionData?.id) return;
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }

        setLoading(true);
        try {
            await api.delete(`/api/v1/sections/${sectionData.id}/`);
            toast({ title: "Section supprimée", status: "success", duration: 3000 });
            onSuccess();
            handleClose();
        } catch (err) {
            toast({ title: "Erreur de suppression", status: "error", duration: 5000 });
        } finally {
            setLoading(false);
            setDeleteConfirm(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>
                    {sectionData ? 'Modifier la section' : 'Ajouter une nouvelle section'}
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody maxH="70vh" overflowY="auto">
                    <VStack spacing={5} align="stretch">

                        {/* CONFIGURATION STRUCTURELLE */}
                        <HStack spacing={4}>
                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="section_active" mb="0" fontSize="sm" fontWeight="semibold">
                                    Section active
                                </FormLabel>
                                <Switch
                                    id="section_active"
                                    colorScheme="purple"
                                    isChecked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            </FormControl>

                            <FormControl isRequired maxW="150px">
                                <FormLabel fontSize="sm" fontWeight="semibold">Ordre d'affichage</FormLabel>
                                <NumberInput
                                    min={1}
                                    value={formData.order}
                                    onChange={(_, val) => setFormData({ ...formData, order: val || 1 })}
                                    focusBorderColor="purple.500"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                        </HStack>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="semibold">Titre de la section</FormLabel>
                            <Input
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="ex: Mesures Électriques ou Rapports de Panne"
                                focusBorderColor="purple.500"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="semibold">Code système (Unique)</FormLabel>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: slugify(e.target.value) })}
                                placeholder="ex: mesures_electriques"
                                focusBorderColor="purple.500"
                                isDisabled={!!sectionData}
                                bg={sectionData ? "gray.50" : "transparent"}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="semibold">Description</FormLabel>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Instructions destinées aux techniciens..."
                                rows={2}
                                focusBorderColor="purple.500"
                            />
                        </FormControl>

                        <Divider my={2} />

                        {/* ENGRENAGE : GESTION DES LOGIQUES DE VISIBILITÉ SÉRIEUSES */}
                        <Box p={4} borderRadius="lg" bg="purple.50" border="1px solid" borderColor="purple.200">
                            <HStack justify="space-between" mb={3}>
                                <VStack align="start" spacing={0}>
                                    <Heading size="xs" color="purple.900">Affichage conditionnel de la Section</Heading>
                                    <Text fontSize="xs" color="purple.700">Rendre toute cette section dépendante de réponses de champs précédents.</Text>
                                </VStack>
                                <Switch
                                    colorScheme="purple"
                                    isChecked={hasConditions}
                                    onChange={(e) => setHasConditions(e.target.checked)}
                                />
                            </HStack>

                            {hasConditions && (
                                <VStack spacing={3} align="stretch" mt={4}>
                                    {/* Méta-propriétés du ConditionGroup */}
                                    <HStack spacing={3} bg="white" p={2} borderRadius="md" border="1px solid #e2e8f0">
                                        <FormControl size="sm">
                                            <FormLabel fontSize="xs" my={0}>Opérateur du Groupe</FormLabel>
                                            <Select
                                                size="xs"
                                                value={conditionGroup.operator}
                                                onChange={(e) => setConditionGroup({ ...conditionGroup, operator: e.target.value as any })}
                                            >
                                                <option value="AND">Toutes les conditions doivent être VRAIES (AND)</option>
                                                <option value="OR">Au moins une condition doit être VRAIE (OR)</option>
                                            </Select>
                                        </FormControl>
                                    </HStack>

                                    {/* Liste des lignes de conditions */}
                                    <Text fontSize="xs" fontWeight="bold" color="purple.900" mt={1}>Conditions à satisfaire :</Text>

                                    {conditionGroup.conditions.map((cond, index) => {
                                        const linkedField = availableFields.find(f => f.id === parseInt(cond.field_definition as string));

                                        return (
                                            <HStack key={index} spacing={2} alignItems="center" bg="white" p={2} borderRadius="md" shadow="sm">
                                                {/* 1. Quel champ surveiller */}
                                                <Select
                                                    size="xs"
                                                    placeholder="Sélectionner le champ parent..."
                                                    value={cond.field_definition}
                                                    onChange={(e) => updateCondition(index, 'field_definition', e.target.value)}
                                                >
                                                    {availableFields.map(f => (
                                                        <option key={f.id} value={f.id}>{f.label || f.code}</option>
                                                    ))}
                                                </Select>

                                                {/* 2. Opérateur de comparaison */}
                                                <Select
                                                    size="xs"
                                                    maxW="110px"
                                                    value={cond.operator}
                                                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                                                >
                                                    {BACKEND_OPERATORS.map(op => (
                                                        <option key={op.value} value={op.value}>{op.label}</option>
                                                    ))}
                                                </Select>

                                                {/* 3. Valeur cible (param_2) injectée de manière polymorphe */}
                                                {!['is_empty', 'not_empty'].includes(cond.operator) && (
                                                    linkedField && ['select', 'multi_select', 'radio'].includes(linkedField.field_type) ? (
                                                        <Select
                                                            size="xs"
                                                            placeholder="Option..."
                                                            value={cond.value || ''}
                                                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                                        >
                                                            {Array.isArray(linkedField.options) && linkedField.options.map((o: any) => (
                                                                <option key={o.value} value={o.value}>{o.label}</option>
                                                            ))}
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            size="xs"
                                                            placeholder="Valeur cible"
                                                            value={cond.value || ''}
                                                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                                        />
                                                    )
                                                )}

                                                <IconButton
                                                    aria-label="Supprimer la règle"
                                                    icon={<FiTrash2 />}
                                                    size="xs"
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    onClick={() => removeCondition(index)}
                                                />
                                            </HStack>
                                        );
                                    })}

                                    <Button
                                        leftIcon={<FiPlus />}
                                        size="xs"
                                        variant="outline"
                                        colorScheme="purple"
                                        onClick={addCondition}
                                        alignSelf="flex-start"
                                    >
                                        Ajouter un critère de validation
                                    </Button>
                                </VStack>
                            )}
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter justify={sectionData ? "space-between" : "flex-end"} gap={2}>
                    {sectionData && (
                        <Button
                            colorScheme="red"
                            variant={deleteConfirm ? "solid" : "outline"}
                            onClick={handleDelete}
                            isLoading={loading}
                            mr="auto"
                        >
                            {deleteConfirm ? "Supprimer TOUT ?" : "Supprimer la section"}
                        </Button>
                    )}

                    <HStack spacing={3}>
                        <Button variant="ghost" onClick={handleClose} isDisabled={loading}>
                            Annuler
                        </Button>
                        <Button colorScheme="purple" type="submit" isLoading={loading}>
                            Enregistrer
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}