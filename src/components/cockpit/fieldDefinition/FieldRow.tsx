import { memo, useMemo, useState } from 'react';
import {
    VStack,
    Stack,
    Badge,
    SimpleGrid,
    Input,
    Select,
    Flex,
    Text,
    Switch,
    HStack,
    IconButton,
    Button,
    Box,
    Tag,
    TagLabel,
    TagCloseButton,
} from '@chakra-ui/react';
import { FiArrowUp, FiArrowDown, FiTrash2, FiPlus } from 'react-icons/fi';
import type { FieldDefinition } from './types';
import { FIELD_TYPES } from './constants';

// Liste des opérateurs calqués sur ton modèle Django Condition
const CONDITION_OPERATORS = [
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

interface FieldRowProps {
    field: FieldDefinition;
    index: number;
    totalFields: number;
    siblingFields: FieldDefinition[];
    onUpdate: (key: keyof FieldDefinition, value: any) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

export const FieldRow = memo(function FieldRow({
    field,
    index,
    totalFields,
    siblingFields,
    onUpdate,
    onDelete,
    onMove,
}: FieldRowProps) {
    const [newOptionLabel, setNewOptionLabel] = useState('');
    const [newOptionValue, setNewOptionValue] = useState('');

    // Détermine si le type de champ nécessite de définir des options de choix
    const hasOptions = ['select', 'multi_select', 'radio'].includes(field.field_type);

    // Extraction sécurisée des options actuelles (JSON)
    const currentOptions = useMemo(() => {
        if (!field.options) return [];
        return Array.isArray(field.options) ? field.options : [];
    }, [field.options]);

    // Un champ peut dépendre de N'IMPORTE QUEL autre champ de la section pour sa condition
    const eligibleMasterFields = useMemo(
        () => siblingFields.filter((f) => f.id !== field.id),
        [siblingFields, field.id]
    );

    // Trouver le champ parent sélectionné pour en extraire ses options ou son type
    const currentMasterField = useMemo(
        () => siblingFields.find((f) => f.id === field.depends_on_field_id),
        [siblingFields, field.depends_on_field_id]
    );

    /* ============================================================================
       GESTION DES OPTIONS (Pour Select, Multi-Select, Radio)
    ============================================================================ */
    const handleAddOption = () => {
        if (!newOptionLabel.trim()) return;
        // Si la valeur est vide, on prend le label slugifié par défaut
        const val = newOptionValue.trim() || newOptionLabel.trim().toLowerCase().replace(/\s+/g, '_');

        const updatedOptions = [...currentOptions, { id: Date.now().toString(), label: newOptionLabel.trim(), value: val }];
        onUpdate('options', updatedOptions);
        setNewOptionLabel('');
        setNewOptionValue('');
    };

    const handleRemoveOption = (optId: string) => {
        const updatedOptions = currentOptions.filter((o: any) => o.id !== optId);
        onUpdate('options', updatedOptions.length > 0 ? updatedOptions : null);
    };

    return (
        <VStack
            align="stretch"
            p={4}
            borderRadius="lg"
            bg="gray.50"
            border="1px solid #e2e8f0"
            spacing={4}
        >
            {/* LIGNE PRINCIPALE : PROPRIÉTÉS DU CHAMP */}
            <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
                <Badge colorScheme="purple" alignSelf="center" px={2} py={1} borderRadius="md">
                    #{index + 1}
                </Badge>

                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} flex={1}>
                    <Input
                        size="sm"
                        bg="white"
                        placeholder="Label (ex: Raison de la panne)"
                        value={field.label || ''}
                        onChange={(e) => onUpdate('label', e.target.value)}
                    />

                    <Input
                        size="sm"
                        bg="white"
                        placeholder="Code API / Slug"
                        value={field.code || ''}
                        onChange={(e) => onUpdate('code', e.target.value)}
                    />

                    <Select
                        size="sm"
                        bg="white"
                        value={field.field_type}
                        onChange={(e) => {
                            onUpdate('field_type', e.target.value);
                            // Reset les options si le type change vers un type sans énumération
                            if (!['select', 'multi_select', 'radio'].includes(e.target.value)) {
                                onUpdate('options', null);
                            }
                        }}
                    >
                        {FIELD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </Select>

                    <Flex align="center" justify="space-between" px={1}>
                        <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                            Obligatoire
                        </Text>
                        <Switch
                            size="sm"
                            colorScheme="purple"
                            isChecked={field.required}
                            onChange={(e) => onUpdate('required', e.target.checked)}
                        />
                    </Flex>
                </SimpleGrid>

                {/* BOUTONS ACTIONS */}
                <HStack alignSelf="center" spacing={1}>
                    <IconButton
                        aria-label="Monter"
                        size="xs"
                        icon={<FiArrowUp />}
                        isDisabled={index === 0}
                        onClick={() => onMove('up')}
                    />
                    <IconButton
                        aria-label="Descendre"
                        size="xs"
                        icon={<FiArrowDown />}
                        isDisabled={index === totalFields - 1}
                        onClick={() => onMove('down')}
                    />
                    <IconButton
                        aria-label="Supprimer"
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        icon={<FiTrash2 />}
                        onClick={onDelete}
                    />
                </HStack>
            </Stack>

            {/* BLOC UNIQUE AUX TYPES : SELECT, MULTI_SELECT, RADIO */}
            {hasOptions && (
                <Box bg="purple.50" p={3} borderRadius="md" border="1px solid" borderColor="purple.100">
                    <Text fontSize="xs" fontWeight="bold" color="purple.700" mb={2}>
                        Options de choix pour ce champ
                    </Text>

                    {/* Liste des options créées */}
                    <Flex wrap="wrap" gap={2} mb={3}>
                        {currentOptions.map((opt: any) => (
                            <Tag key={opt.id} size="sm" borderRadius="full" variant="solid" colorScheme="purple">
                                <TagLabel>{opt.label} ({opt.value})</TagLabel>
                                <TagCloseButton onClick={() => handleRemoveOption(opt.id)} />
                            </Tag>
                        ))}
                        {currentOptions.length === 0 && (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">Aucune option définie. Ajoutez-en ci-dessous :</Text>
                        )}
                    </Flex>

                    {/* Formulaire rapide d'ajout d'option */}
                    <HStack spacing={2}>
                        <Input
                            size="xs"
                            bg="white"
                            placeholder="Nom de l'option (ex: Oui)"
                            value={newOptionLabel}
                            onChange={(e) => setNewOptionLabel(e.target.value)}
                        />
                        <Input
                            size="xs"
                            bg="white"
                            placeholder="Valeur technique (Optionnel, ex: oui)"
                            value={newOptionValue}
                            onChange={(e) => setNewOptionValue(e.target.value)}
                        />
                        <IconButton
                            aria-label="Ajouter l'option"
                            icon={<FiPlus />}
                            size="xs"
                            colorScheme="purple"
                            onClick={handleAddOption}
                        />
                    </HStack>
                </Box>
            )}

            {/* CONDITIONS D'AFFICHAGE (Calqué sur le modèle Condition de Django) */}
            <Stack
                direction={{ base: 'column', lg: 'row' }}
                bg="white"
                p={3}
                borderRadius="md"
                border="1px dashed"
                borderColor="gray.300"
                align={{ base: 'stretch', lg: 'center' }}
                spacing={3}
            >
                <Text fontSize="xs" fontWeight="bold" minW="140px" color="gray.700">
                    👁️ Affichage conditionnel
                </Text>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2} flex={1}>
                    {/* 1. Sélection du Champ Parent */}
                    <Select
                        size="xs"
                        placeholder="Dépend d'un autre champ..."
                        value={field.depends_on_field_id || ''}
                        onChange={(e) => {
                            const val = e.target.value || null;
                            onUpdate('depends_on_field_id', val);
                            if (!val) {
                                onUpdate('depends_on_operator', 'eq');
                                onUpdate('depends_on_value', null);
                            }
                        }}
                    >
                        {eligibleMasterFields.map((master) => (
                            <option key={master.id} value={master.id}>
                                {master.label || master.code}
                            </option>
                        ))}
                    </Select>

                    {/* 2. Sélection de l'Opérateur (Actif uniquement si un parent est choisi) */}
                    <Select
                        size="xs"
                        isDisabled={!field.depends_on_field_id}
                        value={field.depends_on_operator || 'eq'}
                        onChange={(e) => onUpdate('depends_on_operator', e.target.value)}
                    >
                        {CONDITION_OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                                {op.label}
                            </option>
                        ))}
                    </Select>

                    {/* 3. Saisie/Sélection de la valeur cible */}
                    {field.depends_on_field_id && !['is_empty', 'not_empty'].includes(field.depends_on_operator || '') && (
                        <>
                            {/* Cas A: Le parent est un choix énumérable (select, radio, multi_select) -> Charger ses options */}
                            {['select', 'multi_select', 'radio'].includes(currentMasterField?.field_type || '') ? (
                                <Select
                                    size="xs"
                                    placeholder="Sélectionner l'option déclenchante"
                                    value={field.depends_on_value || ''}
                                    onChange={(e) => onUpdate('depends_on_value', e.target.value)}
                                >
                                    {Array.isArray(currentMasterField?.options) &&
                                        currentMasterField.options.map((opt: any) => (
                                            <option key={opt.id || opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                </Select>
                            ) : currentMasterField?.field_type === 'checkbox' ? (
                                /* Cas B: Le parent est une Checkbox */
                                <Select
                                    size="xs"
                                    value={field.depends_on_value || 'true'}
                                    onChange={(e) => onUpdate('depends_on_value', e.target.value)}
                                >
                                    <option value="true">Coché (True)</option>
                                    <option value="false">Décoché (False)</option>
                                </Select>
                            ) : (
                                /* Cas C: Le parent est un type classique (text, number, etc.) -> Input libre */
                                <Input
                                    size="xs"
                                    placeholder="Valeur attendue"
                                    value={field.depends_on_value || ''}
                                    onChange={(e) => onUpdate('depends_on_value', e.target.value)}
                                />
                            )}
                        </>
                    )}
                </SimpleGrid>
            </Stack>
        </VStack>
    );
});