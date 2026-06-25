import { useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
    ModalCloseButton, Button, FormControl, FormLabel, Input, Select, Switch,
    VStack, HStack, Box, useToast, IconButton, Text, Flex
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import api from '../../../api/apiClient'; // Ajuster le chemin selon l'architecture
// Ajouter FieldType à l'import existant
import { FIELD_TYPE_OPTIONS } from './constants';

import type {
    BuilderField,
    ConditionGroup,
    FieldType
} from './constants';
import ConditionGroupDrawer from '../ConditionGroupDrawer';

// Imports stricts depuis constants.ts

// --- Interfaces ---

export interface FieldOption {
    label: string;
    value: string;
}


export interface FieldData {
    id?: number | string;
    label?: string;
    code?: string;
    field_type?: FieldType; // Remplacement de string par FieldType
    required?: boolean;
    placeholder?: string;
    unit?: string;
    options?: FieldOption[]; // Standardisation (voir point 2)
    visibility_condition_group?: ConditionGroup | null;
}

export interface FieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionId: number | string;
    fieldData?: FieldData | null;
    availableFields: BuilderField[];
    onSuccess: () => void;
}

// --- Composant Principal ---

export const FieldModal = ({
    isOpen,
    onClose,
    sectionId,
    fieldData,
    availableFields,
    onSuccess
}: FieldModalProps) => {
    const toast = useToast();
    const [loading, setLoading] = useState<boolean>(false);

    // 🧩 Field States
    const [label, setLabel] = useState<string>('');
    const [fieldCode, setFieldCode] = useState<string>('');

    // Typage explicite avec la valeur par défaut
    const [type, setType] = useState<FieldType>('text');
    const [required, setRequired] = useState<boolean>(false);
    const [placeholder, setPlaceholder] = useState<string>('');
    const [unit, setUnit] = useState<string>('');
    const [options, setOptions] = useState<FieldOption[]>([]);

    // 🧠 Condition States (ConditionGroupDrawer)
    const [isConditionDrawerOpen, setIsConditionDrawerOpen] = useState<boolean>(false);
    const [visibilityConditionGroup, setVisibilityConditionGroup] = useState<ConditionGroup | null>(null);

    // Initialisation
    useEffect(() => {
        if (!isOpen) return;

        if (fieldData) {
            setLabel(fieldData.label || '');
            setFieldCode(fieldData.code || '');
            setType(fieldData.field_type || 'text');
            setRequired(!!fieldData.required);
            setPlaceholder(fieldData.placeholder || '');
            setUnit(fieldData.unit || '');


            // S'assurer de toujours manipuler et formater en FieldOption[]
            const formattedOptions: FieldOption[] = Array.isArray(fieldData.options)
                ? fieldData.options.map(opt =>
                    typeof opt === 'string' ? { label: opt, value: opt } : opt
                )
                : [];
            setOptions(formattedOptions);

            // Remplacement de condition_group_data par visibility_condition_group
            setVisibilityConditionGroup(fieldData.visibility_condition_group || null);
        } else {
            setLabel('');
            setFieldCode('');
            setType('text');
            setRequired(false);
            setPlaceholder('');
            setUnit('');
            setOptions([]);
            setVisibilityConditionGroup(null);
        }
    }, [isOpen, fieldData]);

    const handleSubmit = async () => {
        if (['select', 'multi_select', 'radio'].includes(type) && options.length === 0) {
            toast({
                title: 'Options manquantes',
                description: 'Ajoutez au moins une option pour ce type de champ.',
                status: 'warning'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                section: sectionId,
                label,
                code: fieldCode,
                field_type: type,
                required,
                placeholder,
                unit,
                options: ['select', 'multi_select', 'radio'].includes(type) ? options : [],
                visibility_condition_group: visibilityConditionGroup
            };

            if (fieldData?.id) {
                await api.put(`/api/v1/field-definitions/${fieldData.id}/`, payload);
            } else {
                await api.post('/api/v1/field-definitions/', payload);
            }
            onSuccess();
            onClose();
        } catch (e: unknown) {
            const errorMessage = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
                || 'Erreur lors de la sauvegarde du champ';
            toast({ title: 'Erreur', description: errorMessage, status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const conditionsCount = visibilityConditionGroup?.conditions?.length || 0;
    const operatorLabel = visibilityConditionGroup?.operator || 'AND';
    // Exclure le champ en cours d'édition des champs utilisables pour les conditions
    const selectableFields = (availableFields ?? []).filter(
        field => field.id !== fieldData?.id
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{fieldData ? 'Modifier le champ' : 'Nouveau champ'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <HStack spacing={4} align="start">
                                <FormControl isRequired flex={2}>
                                    <FormLabel>Libellé du champ</FormLabel>
                                    <Input
                                        value={label}
                                        onChange={(e) => {
                                            const newLabel = e.target.value;
                                            setLabel(newLabel);
                                            if (!fieldData) {
                                                setFieldCode(
                                                    newLabel.toLowerCase()
                                                        .normalize("NFD")
                                                        .replace(/[\u0300-\u036f]/g, "")
                                                        .trim()
                                                        .replace(/\s+/g, '_')
                                                        .replace(/[^a-z0-9_]/g, '')
                                                );
                                            }
                                        }}
                                        placeholder="Ex: Température ambiante"
                                    />
                                </FormControl>
                                <FormControl isRequired flex={1}>
                                    <FormLabel>Code technique</FormLabel>
                                    <Input
                                        value={fieldCode}
                                        onChange={(e) => setFieldCode(e.target.value)}
                                        isReadOnly={!!fieldData}
                                        bg={fieldData ? "gray.50" : "white"}
                                    />
                                </FormControl>
                            </HStack>

                            <HStack spacing={4} align="start">
                                <FormControl isRequired flex={2}>
                                    <FormLabel>Type de donnée</FormLabel>
                                    <Select value={type} onChange={(e) => setType(e.target.value)}>
                                        {FIELD_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl flex={1}>
                                    <FormLabel>Unité</FormLabel>
                                    <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: °C, kg" />
                                </FormControl>
                            </HStack>

                            <FormControl>
                                <FormLabel>Placeholder</FormLabel>
                                <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Texte d'exemple..." />
                            </FormControl>

                            {/* Options de choix dynamique */}
                            {['select', 'multi_select', 'radio'].includes(type) && (
                                <Box border="1px solid" borderColor="gray.200" p={4} borderRadius="md" bg="gray.50">
                                    <FormLabel fontWeight="bold">Options de choix</FormLabel>
                                    <VStack spacing={2} align="stretch">
                                        {options.map((opt, index) => (
                                            <HStack key={index}>
                                                <Input
                                                    size="sm"
                                                    bg="white"
                                                    placeholder="Label de l'option"
                                                    value={opt.label || ''}
                                                    onChange={(e) => {
                                                        const updated = [...options];
                                                        updated[index] = {
                                                            label: e.target.value,
                                                            value: e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '_')
                                                        };
                                                        setOptions(updated);
                                                    }}
                                                />
                                                <IconButton
                                                    aria-label="Supprimer"
                                                    icon={<FiTrash2 />}
                                                    size="sm"
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    onClick={() => setOptions(options.filter((_, i) => i !== index))}
                                                />
                                            </HStack>
                                        ))}
                                        <Button
                                            size="sm"
                                            leftIcon={<FiPlus />}
                                            onClick={() => setOptions([...options, { label: '', value: '' }])}
                                            alignSelf="flex-start"
                                        >
                                            Ajouter une option
                                        </Button>
                                    </VStack>
                                </Box>
                            )}

                            <FormControl display="flex" alignItems="center" justifyContent="space-between" borderTop="1px solid" borderColor="gray.100" pt={4}>
                                <FormLabel mb={0} fontWeight="bold">Ce champ est obligatoire</FormLabel>
                                <Switch isChecked={required} onChange={(e) => setRequired(e.target.checked)} colorScheme="purple" />
                            </FormControl>

                            {/* Zone logique conditionnelle résumée UX */}
                            <Box
                                border="1px dashed"
                                borderColor={conditionsCount > 0 ? "purple.300" : "gray.300"}
                                p={4}
                                borderRadius="md"
                                bg={conditionsCount > 0 ? "purple.50" : "transparent"}
                            >
                                <Flex justify="space-between" align="center">
                                    <VStack align="start" spacing={1}>
                                        <FormLabel mb={0} fontWeight="bold" color={conditionsCount > 0 ? "purple.700" : "gray.700"}>
                                            Logique conditionnelle (Visibilité du Champ)
                                        </FormLabel>
                                        <Text fontSize="sm" color="gray.600">
                                            {conditionsCount === 0
                                                ? "Aucune règle définie"
                                                : `${conditionsCount} condition(s) (${operatorLabel})`}
                                        </Text>
                                    </VStack>
                                    <Button
                                        size="sm"
                                        leftIcon={<FiEdit2 />}
                                        colorScheme={conditionsCount > 0 ? "purple" : "gray"}
                                        variant={conditionsCount > 0 ? "solid" : "outline"}
                                        onClick={() => setIsConditionDrawerOpen(true)}
                                    >
                                        {conditionsCount > 0 ? "Modifier les règles" : "Gérer les règles"}
                                    </Button>
                                </Flex>
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter borderTop="1px solid" borderColor="gray.100">
                        <Button variant="ghost" onClick={onClose} mr={3}>Annuler</Button>
                        <Button colorScheme="purple" onClick={handleSubmit} isLoading={loading}>Sauvegarder</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Condition Group Drawer */}
            <ConditionGroupDrawer
                isOpen={isConditionDrawerOpen}
                onClose={() => setIsConditionDrawerOpen(false)}
                title={`Visibilité : ${label || 'Nouveau champ'}`}
                availableFields={selectableFields} // Utilisation de la liste filtrée
                value={visibilityConditionGroup}
                onSave={setVisibilityConditionGroup}
            />
        </>
    );
};