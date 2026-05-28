import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Flex,
    VStack,
    HStack,
    Button,
    Text,
    Heading,
    SimpleGrid,
    useToast,
    Badge,
    Divider,
    useDisclosure,
} from '@chakra-ui/react';
import { FiPlus, FiCloudLightning } from 'react-icons/fi';

import api from '../../api/apiClient';
import FieldDefinitionModal from './FieldDefinitionModal';
import { FieldRow } from './fieldDefinition/FieldRow';
import type { InterventionType, Section, FieldDefinition } from './fieldDefinition/types';
import { wouldCreateCycle } from './fieldDefinition/helpers';

export default function FieldDefinitionTable() {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string | number>('');
    const [sections, setSections] = useState<Section[]>([]);
    const [isDeploying, setIsDeploying] = useState<Record<string | number, boolean>>({});

    const fieldCounterRef = useRef(0);

    /* FETCH TYPES */
    useEffect(() => {
        api.get('/api/v1/intervention-types/')
            .then((res) => {
                const data = res.data.results || res.data;
                setInterventionTypes(data);
                if (data.length > 0) {
                    setSelectedTypeId(data[0].id);
                }
            })
            .catch((err) => console.error(err));
    }, []);

    /* FETCH STRUCTURE */
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
                if (err.name !== 'CanceledError') console.error(err);
            }
        };

        fetchStructure();
        return () => controller.abort();
    }, [selectedTypeId]);

    /* CALLBACKS LOGIQUE DE SECTIONS / CHAMPS */
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

    const removeFieldFromSectionLocal = useCallback((sectionId: string | number, fieldId: string | number) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                return {
                    ...section,
                    fields: section.fields.filter((field) => field.id !== fieldId),
                };
            })
        );
    }, []);

    const updateFieldLocal = useCallback((
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
                                ...(key === 'depends_on_field_id' ? { depends_on_value: null } : {}),
                            }
                            : field
                    ),
                };
            })
        );
    }, []);

    const moveFieldLocal = useCallback((sectionId: string | number, index: number, direction: 'up' | 'down') => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;

                const targetIndex = direction === 'up' ? index - 1 : index + 1;
                if (targetIndex < 0 || targetIndex >= section.fields.length) return section;

                const updated = [...section.fields];
                [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

                return { ...section, fields: updated };
            })
        );
    }, []);

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

            toast({ title: 'Déploiement réussi', status: 'success', duration: 3000 });
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
                <Heading size="xs" textTransform="uppercase" mb={4} color="gray.500">
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
            <Box gridColumn={{ base: 'span 1', lg: 'span 3' }} bg="white" p={5} borderRadius="xl" border="1px solid #eee">
                <Flex justify="space-between" align="center" mb={6}>
                    <Box>
                        <Heading size="md">Builder intelligent</Heading>
                        <Text fontSize="sm" color="gray.500">Champs dynamiques conditionnels</Text>
                    </Box>
                    <Button leftIcon={<FiPlus />} colorScheme="purple" variant="outline" size="sm" onClick={onOpen}>
                        Nouvelle section
                    </Button>
                </Flex>

                <Divider mb={6} />

                <VStack spacing={6} align="stretch">
                    {sections.map((section) => (
                        <Box key={section.id} p={4} borderRadius="xl" border="1px solid" borderColor="purple.100">
                            <Flex justify="space-between" align="center" mb={4}>
                                <HStack>
                                    <Text fontWeight="bold" color="purple.700">{section.title}</Text>
                                    <Badge colorScheme="purple">{section.fields.length} champs</Badge>
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
                                        onUpdate={(key, value) => updateFieldLocal(section.id, field.id, key, value)}
                                        onDelete={() => removeFieldFromSectionLocal(section.id, field.id)}
                                        onMove={(direction) => moveFieldLocal(section.id, index, direction)}
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