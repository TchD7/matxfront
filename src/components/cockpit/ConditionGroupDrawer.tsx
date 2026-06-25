import {
    Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
    VStack, HStack, Box, Text, Select, Input, Button, IconButton, useToast, Divider, Badge,
    Alert, AlertIcon, AlertDescription, Collapse, Flex
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiXCircle } from 'react-icons/fi';

// 1. Imports depuis constants.ts
import {
    CONDITION_OPERATORS,
    CONDITION_GROUP_OPERATORS,
    FIELD_OPERATORS
} from './fieldDefinition/constants';
import type {
    Condition,
    ConditionGroup,
    BuilderField,
    ConditionOperator,
    ConditionGroupOperator
} from './fieldDefinition/constants';

// --- Contraintes 3 & 4 : Type Guard et Constantes Typées ---

function isSupportedFieldType(
    fieldType: string
): fieldType is keyof typeof FIELD_OPERATORS {
    return fieldType in FIELD_OPERATORS;
}

const OPERATORS_WITHOUT_VALUE: ConditionOperator[] = [
    "checked",
    "is_empty",
    "not_empty"
];

const ARRAY_EXPECTED_OPERATORS: ConditionOperator[] = [
    "in",
    "not_in"
];

// --- Interfaces du composant ---

interface ConditionGroupDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    availableFields: BuilderField[];
    value?: ConditionGroup | null;
    onSave: (group: ConditionGroup | null) => void;
}

// --- Sous-composant : Éditeur de valeur ---

const ConditionValueEditor = ({ field, operator, value, onChange }: {
    field?: BuilderField,
    operator: ConditionOperator,
    value: any,
    onChange: (val: any) => void
}) => {
    // 4. Utilisation de la constante typée sans cast
    if (OPERATORS_WITHOUT_VALUE.includes(operator)) {
        return null;
    }

    if (!field) return <Input size="sm" isDisabled placeholder="Sélectionnez un champ d'abord" />;

    const isArrayExpected = ARRAY_EXPECTED_OPERATORS.includes(operator);

    switch (field.field_type) {
        case 'number':
            return <Input size="sm" type="number" placeholder="Valeur" value={value ?? ''} onChange={(e) => onChange(e.target.value !== '' ? Number(e.target.value) : undefined)} />;

        case 'checkbox':
            return (
                <Select
                    size="sm"
                    value={value === true ? "true" : value === false ? "false" : ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange(val === "true" ? true : val === "false" ? false : undefined);
                    }}
                >
                    <option value="">Sélectionner...</option>
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                </Select>
            );

        case 'select':
        case 'radio':
            if (isArrayExpected) {
                return (
                    <Input
                        size="sm"
                        placeholder="Options séparées par une virgule"
                        value={Array.isArray(value) ? value.join(', ') : value || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            onChange(val.split(',').map(s => s.trim()).filter(Boolean));
                        }}
                    />
                );
            }
            return (
                <Select size="sm" value={value || ''} onChange={(e) => onChange(e.target.value)}>
                    <option value="">Sélectionner une option...</option>
                    {/* 7. Retour strict à la liste de chaînes simples */}
                    {field.options?.map(opt => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </Select>
            );

        case 'multi_select':
            return (
                <Input
                    size="sm"
                    placeholder="Valeurs (séparées par une virgule)"
                    value={Array.isArray(value) ? value.join(', ') : value || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange(isArrayExpected ? val.split(',').map(s => s.trim()).filter(Boolean) : val);
                    }}
                />
            );

        case 'date':
            return <Input size="sm" type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
        case 'time':
            return <Input size="sm" type="time" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
        case 'datetime':
            return <Input size="sm" type="datetime-local" value={value || ''} onChange={(e) => onChange(e.target.value)} />;

        case 'text':
        case 'textarea':
        default:
            return <Input size="sm" placeholder="Valeur" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    }
};

// --- Composant Principal ---

export default function ConditionGroupDrawer({
    isOpen,
    onClose,
    title = "Règles Conditionnelles",
    availableFields,
    value,
    onSave
}: ConditionGroupDrawerProps) {
    // 2. Utilisation du bon type à la source (ConditionGroupOperator)
    const [operator, setOperator] = useState<ConditionGroupOperator>('AND');
    const [conditions, setConditions] = useState<Condition[]>([]);
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            setOperator(value?.operator || 'AND');
            setConditions(value?.conditions || []);
        }
    }, [isOpen, value]);

    const getField = (id: number) => availableFields.find(f => f.id === id);

    // 5. Ajout d'une ligne conforme au type natif et sans aucun cast
    const addConditionRow = () => {
        setConditions(prev => [
            ...prev,
            { field_definition: 0, operator: "eq", value: "" }
        ]);
    };

    const removeConditionRow = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const removeAllConditions = () => {
        setConditions([]);
    };

    // 6. Mise à jour structurelle sans cast
    const updateConditionRow = (index: number, key: keyof Condition, val: any) => {
        setConditions(prev => prev.map((c, i) => {
            if (i === index) {
                if (key === "field_definition") {
                    return {
                        ...c,
                        field_definition: val,
                        operator: "eq",
                        value: ""
                    };
                } else if (key === "operator") {
                    return {
                        ...c,
                        operator: val
                    };
                } else {
                    return {
                        ...c,
                        value: val
                    };
                }
            }
            return c;
        }));
    };

    const handleSave = () => {
        const hasInvalidCondition = conditions.some(c => c.field_definition === 0 || !c.operator);
        if (hasInvalidCondition) {
            toast({
                title: "Validation échouée",
                description: "Veuillez vérifier que chaque condition a un champ et un opérateur définis.",
                status: "warning",
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        if (conditions.length === 0) {
            onSave(null);
            onClose();
            return;
        }

        const cleanedConditions: Condition[] = conditions.map(c => {
            const cond: Condition = {
                field_definition: c.field_definition,
                operator: c.operator
            };
            if (!OPERATORS_WITHOUT_VALUE.includes(c.operator)) {
                cond.value = c.value;
            }
            return cond;
        });

        onSave({
            operator,
            conditions: cleanedConditions
        });

        onClose();
    };

    return (
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
            <DrawerOverlay />
            <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader borderBottomWidth="1px" bg="gray.50">
                    <Text fontSize="lg" fontWeight="bold">Éditeur de Conditions</Text>
                    <Text fontSize="sm" color="purple.600" mt={1}>{title}</Text>
                </DrawerHeader>

                <DrawerBody py={6} bg="gray.50">
                    <VStack spacing={6} align="stretch">

                        <Box bg="white" p={4} borderRadius="md" shadow="sm" borderWidth="1px">
                            <Flex justify="space-between" align="center">
                                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                                    Combiner les règles avec :
                                </Text>
                                <HStack spacing={2}>
                                    {CONDITION_GROUP_OPERATORS.map(op => (
                                        <Button
                                            key={op.value}
                                            size="sm"
                                            colorScheme={operator === op.value ? 'purple' : 'gray'}
                                            onClick={() => setOperator(op.value as ConditionGroupOperator)}
                                        >
                                            {op.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </Flex>
                        </Box>

                        <Divider />

                        {conditions.length === 0 ? (
                            <Alert status="info" borderRadius="md" variant="subtle">
                                <AlertIcon />
                                <Box>
                                    <Text fontWeight="bold" fontSize="sm">Aucune condition définie.</Text>
                                    <AlertDescription fontSize="xs">
                                        Ce groupe ne filtrera rien (comportement par défaut).
                                    </AlertDescription>
                                </Box>
                            </Alert>
                        ) : (
                            <VStack spacing={4} align="stretch">
                                {conditions.map((cond, index) => {
                                    const selectedField = getField(cond.field_definition);

                                    // 3. Application du Type Guard pour filtrer de manière robuste FIELD_OPERATORS
                                    const operators = (() => {
                                        if (!selectedField || !isSupportedFieldType(selectedField.field_type)) {
                                            return [];
                                        }
                                        const allowedOperators = FIELD_OPERATORS[selectedField.field_type];
                                        return CONDITION_OPERATORS.filter(op => allowedOperators.includes(op.value));
                                    })();

                                    return (
                                        <Collapse in={true} animateOpacity key={index}>
                                            <Box bg="white" p={4} borderRadius="md" shadow="sm" borderWidth="1px">
                                                <HStack justify="space-between" mb={3}>
                                                    <HStack>
                                                        <Badge colorScheme="purple" variant="subtle">
                                                            Condition {index + 1}
                                                        </Badge>
                                                        {selectedField && (
                                                            <Badge colorScheme="gray" textTransform="lowercase">
                                                                {selectedField.field_type}
                                                            </Badge>
                                                        )}
                                                    </HStack>
                                                    <IconButton
                                                        aria-label="Supprimer"
                                                        icon={<FiTrash2 />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => removeConditionRow(index)}
                                                    />
                                                </HStack>

                                                <HStack spacing={3}>
                                                    <Select
                                                        size="sm"
                                                        placeholder="Sélectionner un champ..."
                                                        value={cond.field_definition || ''}
                                                        onChange={(e) => updateConditionRow(index, 'field_definition', Number(e.target.value))}
                                                        flex="1.5"
                                                    >
                                                        {availableFields.map(f => (
                                                            <option key={f.id} value={f.id}>{f.label} ({f.code})</option>
                                                        ))}
                                                    </Select>

                                                    <Select
                                                        size="sm"
                                                        value={cond.operator}
                                                        onChange={(e) => updateConditionRow(index, 'operator', e.target.value as ConditionOperator)}
                                                        flex="1"
                                                        isDisabled={!selectedField || operators.length === 0}
                                                    >
                                                        {operators.map(op => (
                                                            <option key={op.value} value={op.value}>{op.label}</option>
                                                        ))}
                                                    </Select>

                                                    <Box flex="1.5">
                                                        <ConditionValueEditor
                                                            field={selectedField}
                                                            operator={cond.operator}
                                                            value={cond.value}
                                                            onChange={(val) => updateConditionRow(index, 'value', val)}
                                                        />
                                                    </Box>
                                                </HStack>
                                            </Box>
                                        </Collapse>
                                    );
                                })}
                            </VStack>
                        )}

                        <HStack justify={conditions.length > 0 ? "space-between" : "flex-start"}>
                            <Button
                                leftIcon={<FiPlus />}
                                variant="outline"
                                colorScheme="purple"
                                size="sm"
                                onClick={addConditionRow}
                            >
                                Ajouter une condition
                            </Button>

                            {conditions.length > 0 && (
                                <Button
                                    leftIcon={<FiXCircle />}
                                    variant="ghost"
                                    colorScheme="red"
                                    size="sm"
                                    onClick={removeAllConditions}

                                >
                                    Tout supprimer
                                </Button>
                            )}
                        </HStack>

                    </VStack>
                </DrawerBody>

                <Box p={4} borderTopWidth="1px" bg="white">
                    <HStack spacing={3} justify="flex-end">
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button
                            leftIcon={<FiSave />}
                            colorScheme="purple"
                            size="sm"
                            onClick={handleSave}
                        >
                            Appliquer les règles
                        </Button>
                    </HStack>
                </Box>
            </DrawerContent>
        </Drawer>
    );
}