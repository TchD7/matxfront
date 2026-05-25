import {
    Box,
    Flex,
    VStack,
    HStack,
    Button,
    Text,
    Input,
    Select,
    Switch,
    Heading,
    SimpleGrid,
    IconButton,
    useToast,
    Badge,
    Divider,
    Stack,
    useDisclosure,
} from '@chakra-ui/react';

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';

import {
    FiPlus,
    FiTrash2,
    FiArrowUp,
    FiArrowDown,
    FiCloudLightning,
} from 'react-icons/fi';

import api from '../../api/apiClient';
import FieldDefinitionModal from './FieldDefinitionModal';

/* ============================================================================
   TYPES
============================================================================ */

interface FieldTypes {
    value: string;
    label: string;
}

interface InterventionType {
    id: string | number;
    name: string;
}

interface FieldOption {
    id: string;
    value: string;
    label: string;
}

interface FieldDefinition {
    id: string | number;
    label: string;
    field_type: string;
    required: boolean;
    code: string;
    order?: number;
    options?: FieldOption[];
    depends_on_field_id?: string | number | null;
    depends_on_value?: string | null;
}

interface Section {
    id: string | number;
    title: string;
    fields: FieldDefinition[];
}

/* ============================================================================
   CONSTANTES
============================================================================ */

const FIELD_TYPES: FieldTypes[] = [
    { value: 'text', label: 'Texte' },
    { value: 'textarea', label: 'Zone de texte' },
    { value: 'number', label: 'Numérique' },
    { value: 'checkbox', label: 'Case à cocher' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Heure' },
    { value: 'datetime', label: 'Date & Heure' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'multi_select', label: 'Sélection multiple' },
    { value: 'radio', label: 'Bouton radio' },
    { value: 'image', label: 'Photo' },
    { value: 'file', label: 'Document' },
    { value: 'signature', label: 'Signature' },
];

/* ============================================================================
   HELPERS
============================================================================ */

function wouldCreateCycle(
    fields: FieldDefinition[],
    sourceFieldId: string | number,
    targetFieldId: string | number | null
): boolean {
    if (!targetFieldId) return false;

    const graph = new Map<string | number, string | number | null>();

    fields.forEach((field) => {
        graph.set(field.id, field.depends_on_field_id || null);
    });

    graph.set(sourceFieldId, targetFieldId);

    let current = targetFieldId;
    const visited = new Set();

    while (current) {
        if (current === sourceFieldId) {
            return true;
        }

        if (visited.has(current)) {
            break;
        }

        visited.add(current);
        current = graph.get(current) || null;
    }

    return false;
}

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export default function FieldDefinitionTable() {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string | number>('');
    const [sections, setSections] = useState<Section[]>([]);
    const [isDeploying, setIsDeploying] = useState<Record<string | number, boolean>>({});

    const fieldCounterRef = useRef(0);

    /* =========================================================================
       FETCH TYPES
    ========================================================================= */
    useEffect(() => {
        api.get('/api/v1/intervention-types/')
            .then((res) => {
                const data = res.data.results || res.data;
                setInterventionTypes(data);
                if (data.length > 0) {
                    setSelectedTypeId(data[0].id);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    /* =========================================================================
       FETCH STRUCTURE
    ========================================================================= */
    useEffect(() => {
        const controller = new AbortController();
        setSections([]);

        if (!selectedTypeId) return;

        const fetchStructure = async () => {
            try {
                const sectionRes = await api.get(
                    `/api/v1/sections/?intervention_type=${selectedTypeId}`,
                    { signal: controller.signal }
                );

                const sectionData = sectionRes.data.results || sectionRes.data;

                const completeSections = await Promise.all(
                    sectionData.map(async (section: any) => {
                        const fieldRes = await api.get(
                            `/api/v1/field-definitions/?section_id=${section.id}`,
                            { signal: controller.signal }
                        );

                        const fields = fieldRes.data.results || fieldRes.data;

                        return {
                            id: section.id,
                            title: section.title,
                            fields: fields.sort(
                                (a: any, b: any) => (a.order || 0) - (b.order || 0)
                            ),
                        };
                    })
                );

                setSections(completeSections);
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    console.error(err);
                }
            }
        };

        fetchStructure();
        return () => controller.abort();
    }, [selectedTypeId]);

    /* =========================================================================
       CALLBACKS
    ========================================================================= */
    const addFieldToSectionLocal = useCallback((sectionId: string | number) => {
        fieldCounterRef.current += 1;
        const tempId = `temp-fld-${crypto.randomUUID()}`;

        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;

                return {
                    ...section,
                    fields: [
                        ...section.fields,
                        {
                            id: tempId,
                            label: '',
                            field_type: 'text',
                            required: false,
                            code: `param_${fieldCounterRef.current}`,
                            options: [],
                            depends_on_field_id: null,
                            depends_on_value: null,
                        },
                    ],
                };
            })
        );
    }, []);

    const removeFieldFromSectionLocal = useCallback(
        (sectionId: string | number, fieldId: string | number) => {
            setSections((prev) =>
                prev.map((section) => {
                    if (section.id !== sectionId) return section;

                    return {
                        ...section,
                        fields: section.fields.filter((field) => field.id !== fieldId),
                    };
                })
            );
        },
        []
    );

    const updateFieldLocal = useCallback(
        (
            sectionId: string | number,
            fieldId: string | number,
            key: keyof FieldDefinition,
            value: any
        ) => {
            setSections((prev) =>
                prev.map((section) => {
                    if (section.id !== sectionId) return section;

                    const currentField = section.fields.find((f) => f.id === fieldId);
                    if (!currentField) return section;

                    // Protection contre les cycles dynamiques
                    if (
                        key === 'depends_on_field_id' &&
                        wouldCreateCycle(section.fields, fieldId, value)
                    ) {
                        return section;
                    }

                    return {
                        ...section,
                        fields: section.fields.map((field) =>
                            field.id === fieldId
                                ? {
                                    ...field,
                                    [key]: value,
                                    // Reset la valeur de dépendance si le parent change
                                    ...(key === 'depends_on_field_id'
                                        ? { depends_on_value: null }
                                        : {}),
                                }
                                : field
                        ),
                    };
                })
            );
        },
        []
    );

    const moveFieldLocal = useCallback(
        (sectionId: string | number, index: number, direction: 'up' | 'down') => {
            setSections((prev) =>
                prev.map((section) => {
                    if (section.id !== sectionId) return section;

                    const targetIndex = direction === 'up' ? index - 1 : index + 1;

                    if (targetIndex < 0 || targetIndex >= section.fields.length) {
                        return section;
                    }

                    const updated = [...section.fields];
                    [updated[index], updated[targetIndex]] = [
                        updated[targetIndex],
                        updated[index],
                    ];

                    return {
                        ...section,
                        fields: updated,
                    };
                })
            );
        },
        []
    );

    /* =========================================================================
       DEPLOY
    ========================================================================= */
    const handleDeploySection = async (section: Section) => {
        try {
            setIsDeploying((prev) => ({ ...prev, [section.id]: true }));

            const payload = section.fields.map((field, index) => ({
                ...(String(field.id).startsWith('temp') ? {} : { id: field.id }),
                label: field.label,
                field_type: field.field_type,
                required: field.required,
                code: field.code,
                order: index,
                depends_on_field_id: field.depends_on_field_id || null,
                depends_on_value: field.depends_on_value || null,
                options: ['select', 'multi_select', 'radio'].includes(field.field_type)
                    ? field.options || []
                    : [],
            }));

            await api.post('/api/v1/field-definitions/deploy/', {
                section_id: section.id,
                fields: payload,
            });

            toast({
                title: 'Déploiement réussi',
                status: 'success',
                duration: 3000,
            });
        } catch (err: any) {
            toast({
                title: 'Erreur déploiement',
                description: err.response?.data?.detail || 'Erreur inconnue',
                status: 'error',
            });
        } finally {
            setIsDeploying((prev) => ({ ...prev, [section.id]: false }));
        }
    };

    return (
        <SimpleGrid columns={{ base: 1, lg: 4 }} gap={6} p={5}>
            {/* PANEL GAUCHE */}
            <Box bg="white" p={4} borderRadius="xl" border="1px solid #eee">
                <Heading
                    size="xs"
                    textTransform="uppercase"
                    mb={4}
                    color="gray.500"
                >
                    Types d'intervention
                </Heading>

                <VStack align="stretch">
                    {interventionTypes.map((type) => {
                        const active = selectedTypeId === type.id;
                        return (
                            <Box
                                key={type.id}
                                p={3}
                                borderRadius="lg"
                                cursor="pointer"
                                bg={active ? 'purple.50' : 'transparent'}
                                color={active ? 'purple.700' : 'gray.700'}
                                fontWeight={active ? 'bold' : 'normal'}
                                onClick={() => setSelectedTypeId(type.id)}
                            >
                                {type.name}
                            </Box>
                        );
                    })}
                </VStack>
            </Box>

            {/* PANEL DROITE */}
            <Box
                gridColumn={{ base: 'span 1', lg: 'span 3' }}
                bg="white"
                p={5}
                borderRadius="xl"
                border="1px solid #eee"
            >
                <Flex justify="space-between" align="center" mb={6}>
                    <Box>
                        <Heading size="md">Builder intelligent</Heading>
                        <Text fontSize="sm" color="gray.500">
                            Champs dynamiques conditionnels
                        </Text>
                    </Box>

                    <Button
                        leftIcon={<FiPlus />}
                        colorScheme="purple"
                        variant="outline"
                        size="sm"
                        onClick={onOpen}
                    >
                        Nouvelle section
                    </Button>
                </Flex>

                <Divider mb={6} />

                <VStack spacing={6} align="stretch">
                    {sections.map((section) => (
                        <Box
                            key={section.id}
                            p={4}
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="purple.100"
                        >
                            <Flex justify="space-between" align="center" mb={4}>
                                <HStack>
                                    <Text fontWeight="bold" color="purple.700">
                                        {section.title}
                                    </Text>
                                    <Badge colorScheme="purple">
                                        {section.fields.length} champs
                                    </Badge>
                                </HStack>

                                <Button
                                    size="xs"
                                    colorScheme="purple"
                                    leftIcon={<FiCloudLightning />}
                                    isLoading={isDeploying[section.id]}
                                    onClick={() => handleDeploySection(section)}
                                >
                                    Déployer
                                </Button>
                            </Flex>

                            <VStack spacing={3} align="stretch">
                                {section.fields.map((field, index) => (
                                    <FieldRow
                                        key={field.id}
                                        field={field}
                                        index={index}
                                        totalFields={section.fields.length}
                                        siblingFields={section.fields}
                                        onUpdate={(key, value) =>
                                            updateFieldLocal(section.id, field.id, key, value)
                                        }
                                        onDelete={() =>
                                            removeFieldFromSectionLocal(section.id, field.id)
                                        }
                                        onMove={(direction) =>
                                            moveFieldLocal(section.id, index, direction)
                                        }
                                    />
                                ))}
                            </VStack>

                            <Button
                                mt={4}
                                size="xs"
                                leftIcon={<FiPlus />}
                                variant="ghost"
                                colorScheme="purple"
                                onClick={() => addFieldToSectionLocal(section.id)}
                            >
                                Ajouter un champ
                            </Button>
                        </Box>
                    ))}
                </VStack>
            </Box>

            <FieldDefinitionModal
                isOpen={isOpen}
                onClose={onClose}
                mode="section"
                interventionTypeId={selectedTypeId}
                currentSectionsCount={sections.length}
                onSuccess={() => setSelectedTypeId(selectedTypeId)}
            />
        </SimpleGrid>
    );
}

/* ============================================================================
   FIELD ROW COMPONENT
============================================================================ */

interface FieldRowProps {
    field: FieldDefinition;
    index: number;
    totalFields: number;
    siblingFields: FieldDefinition[];
    onUpdate: (key: keyof FieldDefinition, value: any) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

const FieldRow = memo(function FieldRow({
    field,
    index,
    totalFields,
    siblingFields,
    onUpdate,
    onDelete,
    onMove,
}: FieldRowProps) {

    // Ajout explicite de 'multi_select' dans les types autorisant les options
    const showOptionsManager = useMemo(
        () => ['select', 'multi_select', 'radio'].includes(field.field_type),
        [field.field_type]
    );

    // ✅ Correction conditions : Inclusion de 'multi_select' comme cible parente éligible
    const eligibleMasterFields = useMemo(
        () =>
            siblingFields.filter(
                (f) =>
                    f.id !== field.id &&
                    ['select', 'multi_select', 'radio', 'checkbox'].includes(f.field_type)
            ),
        [siblingFields, field.id]
    );

    const currentMasterField = useMemo(
        () => siblingFields.find((f) => f.id === field.depends_on_field_id),
        [siblingFields, field.depends_on_field_id]
    );

    return (
        <VStack
            align="stretch"
            p={3}
            borderRadius="lg"
            bg="gray.50"
            border="1px solid #eee"
        >
            <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
                <Badge colorScheme="purple" alignSelf="center">
                    #{index + 1}
                </Badge>

                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} flex={1}>
                    <Input
                        size="sm"
                        bg="white"
                        placeholder="Label"
                        value={field.label}
                        onChange={(e) => onUpdate('label', e.target.value)}
                    />

                    <Input
                        size="sm"
                        bg="white"
                        placeholder="Code API"
                        value={field.code}
                        onChange={(e) => onUpdate('code', e.target.value)}
                    />

                    <Select
                        size="sm"
                        bg="white"
                        value={field.field_type}
                        onChange={(e) => onUpdate('field_type', e.target.value)}
                    >
                        {FIELD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </Select>

                    <Flex align="center">
                        <Text fontSize="xs" mr={2}>
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

                <HStack alignSelf="center">
                    <IconButton
                        aria-label="up"
                        size="xs"
                        icon={<FiArrowUp />}
                        isDisabled={index === 0}
                        onClick={() => onMove('up')}
                    />
                    <IconButton
                        aria-label="down"
                        size="xs"
                        icon={<FiArrowDown />}
                        isDisabled={index === totalFields - 1}
                        onClick={() => onMove('down')}
                    />
                    <IconButton
                        aria-label="delete"
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        icon={<FiTrash2 />}
                        onClick={onDelete}
                    />
                </HStack>
            </Stack>

            {/* CONDITIONS D'AFFICHAGE */}
            <Stack
                direction={{ base: 'column', md: 'row' }}
                bg="white"
                p={2}
                borderRadius="md"
                border="1px dashed #ccc"
                align="center"
            >
                <Text fontSize="xs" fontWeight="bold" minW="160px">
                    Affichage conditionnel
                </Text>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} flex={1} w="100%">
                    <Select
                        size="xs"
                        placeholder="Champ parent"
                        value={field.depends_on_field_id || ''}
                        onChange={(e) => onUpdate('depends_on_field_id', e.target.value || null)}
                    >
                        {eligibleMasterFields.map((master) => (
                            <option key={master.id} value={master.id}>
                                {master.label} ({FIELD_TYPES.find(t => t.value === master.field_type)?.label})
                            </option>
                        ))}
                    </Select>

                    {field.depends_on_field_id && (
                        <Select
                            size="xs"
                            placeholder="Sélectionner la valeur déclenchante"
                            value={field.depends_on_value || ''}
                            onChange={(e) => onUpdate('depends_on_value', e.target.value)}
                        >
                            {currentMasterField?.field_type === 'checkbox' ? (
                                <>
                                    <option value="true">Coché</option>
                                    <option value="false">Décoché</option>
                                </>
                            ) : (
                                currentMasterField?.options?.map((opt) => (
                                    <option key={opt.id} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))
                            )}
                        </Select>
                    )}
                </SimpleGrid>
            </Stack>
        </VStack>
    );
});