import {
    Box,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Select,
    Checkbox,
    CheckboxGroup,
    Textarea,
    Button,
    useToast,
    Spinner,
    Center,
    Text,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    IconButton,
    Icon,
    Badge,
    StackDivider,
    SimpleGrid
} from '@chakra-ui/react';

import { useState, useEffect } from 'react';
import { FiEdit2, FiCheck, FiFileText } from 'react-icons/fi';
import api from '../../api/apiClient';

// ================= TYPES =================
interface FieldDefinition {
    id: string | number;
    code: string;
    label: string;
    field_type: string;
    required: boolean;
    options?: any;
}

interface Section {
    id: string | number;
    title: string;
    fields: FieldDefinition[];
}

interface Ticket {
    id: string;
    intervention_type?: any;
}

export default function TicketFieldsTab({
    ticket,
    onRefresh,
}: {
    ticket: Ticket;
    onRefresh: () => void;
}) {
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [values, setValues] = useState<Record<string, any>>({});
    const [valueRecordIds, setValueRecordIds] = useState<Record<string, string | number>>({});

    const [isSavedReport, setIsSavedReport] = useState(false);
    const [editingFields, setEditingFields] = useState<Record<string | number, boolean>>({});

    const loadDynamicForm = async () => {
        if (!ticket?.id) return;

        try {
            setLoading(true);

            const interventionTypeId = typeof ticket.intervention_type === 'object'
                ? ticket.intervention_type?.id
                : ticket.intervention_type;

            if (!interventionTypeId) {
                setSections([]);
                setLoading(false);
                return;
            }

            const [sectionsRes, fieldsRes, valuesRes] = await Promise.all([
                api.get(`/api/v1/sections/?intervention_type=${interventionTypeId}`),
                api.get(`/api/v1/field-definitions/?page_size=200`),
                api.get(`/api/v1/ticket-field-values/?ticket_id=${ticket.id}`)
            ]);

            const sectionsData = sectionsRes.data.results || sectionsRes.data;
            const allFieldsData = fieldsRes.data.results || fieldsRes.data;
            const existingValuesData = valuesRes.data.results || valuesRes.data;

            let isNewForm = !existingValuesData || existingValuesData.length === 0;
            setIsSavedReport(!isNewForm);

            const completedSections = sectionsData.map((section: any) => {
                const sectionFields = allFieldsData
                    .filter((field: any) => {
                        const fSectionId = typeof field.section === 'object'
                            ? field.section?.id
                            : (field.section || field.section_id);
                        return String(fSectionId) === String(section.id);
                    })
                    .map((field: any) => ({
                        id: field.id,
                        code: field.code,
                        label: field.label,
                        field_type: field.field_type,
                        required: field.required ?? false,
                        options: field.options || [],
                        order: field.order || 0
                    }));

                return {
                    id: section.id,
                    title: section.title,
                    fields: sectionFields.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                };
            });

            setSections(completedSections);

            const initialValues: Record<string, any> = {};
            const recordIds: Record<string, string | number> = {};

            // Initialisation propre selon le type de champ
            completedSections.forEach((sec: any) => {
                sec.fields.forEach((field: any) => {
                    if (field.field_type === 'checkbox') {
                        initialValues[field.id] = false;
                    } else if (field.field_type === 'multi_select') {
                        initialValues[field.id] = [];
                    } else {
                        initialValues[field.id] = '';
                    }
                });
            });

            // Hydratation et parsing des données du backend
            if (!isNewForm) {
                existingValuesData.forEach((item: any) => {
                    const fieldId = item.field_definition?.id || item.field_definition || item.field_id || item.field_definition_id;
                    if (fieldId) {
                        const targetField = allFieldsData.find((f: any) => String(f.id) === String(fieldId));
                        let parsedValue = item.value;

                        if (targetField?.field_type === 'checkbox') {
                            parsedValue = item.value === true || item.value === 'true';
                        } else if (targetField?.field_type === 'multi_select') {
                            if (Array.isArray(item.value)) {
                                parsedValue = item.value;
                            } else if (typeof item.value === 'string') {
                                if (item.value.startsWith('[') && item.value.endsWith(']')) {
                                    try { parsedValue = JSON.parse(item.value); } catch { parsedValue = []; }
                                } else {
                                    parsedValue = item.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                                }
                            } else {
                                parsedValue = [];
                            }
                        }

                        initialValues[fieldId] = parsedValue ?? (targetField?.field_type === 'multi_select' ? [] : '');
                        recordIds[fieldId] = item.id;
                    }
                });
            }

            setValues(initialValues);
            setValueRecordIds(recordIds);

        } catch (err) {
            console.error("[loadDynamicForm] Erreur :", err);
            toast({ title: 'Erreur de chargement du formulaire', status: 'error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDynamicForm();
    }, [ticket?.id, ticket?.intervention_type]);

    const handleChange = (fieldId: string | number, value: any) => {
        setValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const toggleEditField = (fieldId: string | number) => {
        setEditingFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
    };

    const saveFields = async () => {
        const missingFields: string[] = [];

        sections.forEach((section) => {
            section.fields.forEach((field) => {
                if (field.required) {
                    const value = values[field.id];
                    if (
                        value === undefined ||
                        value === null ||
                        (typeof value === 'string' && value.trim() === '') ||
                        (Array.isArray(value) && value.length === 0)
                    ) {
                        missingFields.push(field.label);
                    }
                }
            });
        });

        if (missingFields.length > 0) {
            toast({
                title: 'Champs obligatoires manquants',
                description: `Veuillez renseigner : ${missingFields.join(', ')}`,
                status: 'warning',
                duration: 4000,
                isClosable: true,
                position: 'top'
            });
            return;
        }

        try {
            setLoadingSave(true);
            const savePromises = Object.entries(values).map(([fieldId, val]) => {
                const existingRecordId = valueRecordIds[fieldId];

                // Uniformisation de l'envoi pour les multi_select si le backend attend du texte JSON ou brut
                const payloadValue = Array.isArray(val) ? val : val;

                if (existingRecordId) {
                    return api.patch(`/api/v1/ticket-field-values/${existingRecordId}/`, { value: payloadValue });
                } else {
                    return api.post(`/api/v1/ticket-field-values/`, {
                        ticket: ticket.id,
                        field_definition: fieldId,
                        value: payloadValue
                    });
                }
            });

            await Promise.all(savePromises);
            toast({ title: 'Rapport enregistré avec succès', status: 'success', duration: 2000 });

            setEditingFields({});
            setIsSavedReport(true);

            await loadDynamicForm();
            onRefresh();
        } catch (err: any) {
            console.error("Erreur de sauvegarde :", err);
            toast({ title: 'Erreur lors de la sauvegarde', status: 'error', duration: 3000 });
        } finally {
            setLoadingSave(false);
        }
    };

    const renderFieldInput = (field: FieldDefinition) => {
        const value = values[field.id];
        switch (field.field_type) {
            case 'text':
                return <Input bg="white" value={value ?? ''} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
            case 'number':
                return <Input bg="white" type="number" value={value ?? ''} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
            case 'textarea':
                return <Textarea bg="white" value={value ?? ''} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" rows={3} />;
            case 'select':
                return (
                    <Select bg="white" value={value ?? ''} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md">
                        <option value="">-- choisir --</option>
                        {field.options?.map((opt: any, idx: number) => (
                            <option key={idx} value={opt.value ?? opt}>
                                {opt.label ?? opt}
                            </option>
                        ))}
                    </Select>
                );
            case 'multi_select':
                return (
                    <CheckboxGroup value={Array.isArray(value) ? value.map(String) : []} onChange={(newVals) => handleChange(field.id, newVals)}>
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2} p={2} bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.200">
                            {field.options?.map((opt: any, idx: number) => {
                                const optVal = opt.value ?? opt;
                                const optLabel = opt.label ?? opt;
                                return (
                                    <Checkbox key={idx} value={String(optVal)} colorScheme="purple" size="sm">
                                        {optLabel}
                                    </Checkbox>
                                );
                            })}
                        </SimpleGrid>
                    </CheckboxGroup>
                );
            case 'checkbox':
                return (
                    <Checkbox isChecked={!!value} onChange={(e) => handleChange(field.id, e.target.checked)} colorScheme="purple" size="md">
                        {field.label}
                    </Checkbox>
                );
            case 'date':
                return <Input bg="white" type="date" value={value ?? ''} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
            case 'time':
                return <Input bg="white" type="time" value={value ?? ''} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
            default:
                return <Input bg="white" value={value ?? ''} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
        }
    };

    // --- AFFICHAGE SUR-MESURE ET VISIBILITÉ DES LABELS ---
    const renderValueReadOnly = (field: FieldDefinition) => {
        const rawValue = values[field.id];

        if (rawValue === undefined || rawValue === null || rawValue === '' || (Array.isArray(rawValue) && rawValue.length === 0)) {
            return <Text color="gray.400" as="span" fontSize="sm" fontStyle="italic">Non renseigné</Text>;
        }

        switch (field.field_type) {
            case 'checkbox':
                return (
                    <Badge colorScheme={rawValue ? "green" : "gray"} variant="subtle" px={2} py={0.5} borderRadius="md">
                        {rawValue ? "Oui / Validé" : "Non / Non applicable"}
                    </Badge>
                );

            case 'select': {
                // Recherche l'option correspondante pour extraire son label humain
                const option = field.options?.find((opt: any) => String(opt.value ?? opt) === String(rawValue));
                const displayLabel = option ? (option.label ?? option) : rawValue;
                return <Text color="gray.800" fontWeight="medium" fontSize="sm">{displayLabel}</Text>;
            }

            case 'multi_select': {
                const selectedList = Array.isArray(rawValue) ? rawValue : [];
                return (
                    <HStack spacing={2} wrap="wrap">
                        {selectedList.map((val: any, idx: number) => {
                            const option = field.options?.find((opt: any) => String(opt.value ?? opt) === String(val));
                            const displayLabel = option ? (option.label ?? option) : val;
                            return (
                                <Badge key={idx} colorScheme="purple" variant="solid" px={2} py={0.5} borderRadius="md" fontSize="xs">
                                    {displayLabel}
                                </Badge>
                            );
                        })}
                    </HStack>
                );
            }

            case 'textarea':
                return <Text color="gray.800" fontWeight="medium" fontSize="sm" whiteSpace="pre-line">{rawValue}</Text>;

            case 'date':
                return <Text color="gray.800" fontWeight="medium" fontSize="sm">{new Date(rawValue).toLocaleDateString('fr-FR')}</Text>;

            default:
                return <Text color="gray.800" fontWeight="medium" fontSize="sm">{String(rawValue)}</Text>;
        }
    };

    if (!ticket) return <Center py={10}><Spinner color="purple.500" /></Center>;
    if (loading) return <Center py={10} flexDir="column" gap={3}><Spinner color="purple.500" size="xl" /><Text color="gray.500" fontSize="sm">Chargement du rapport technique...</Text></Center>;
    if (sections.length === 0) return <Center py={10}><Text>Aucune section configurée.</Text></Center>;

    return (
        <Box p={4} maxW="4xl" mx="auto">
            <VStack spacing={6} align="stretch">

                {isSavedReport && (
                    <HStack bg="purple.50" borderLeft="4px solid" borderColor="purple.500" p={3} borderRadius="md" justify="space-between" w="100%">
                        <HStack spacing={2}>
                            <Icon as={FiFileText} color="purple.600" boxSize={5} />
                            <Text fontWeight="bold" color="purple.900" fontSize="sm">Rapport d'intervention verrouillé</Text>
                        </HStack>
                        <Text fontSize="xs" color="purple.700">Cliquez sur le crayon en bout de ligne pour modifier un champ spécifique.</Text>
                    </HStack>
                )}

                <Accordion allowMultiple defaultIndex={sections.map((_, i) => i)}>
                    {sections.map((section) => (
                        <AccordionItem key={section.id} border="1px solid" borderColor="gray.200" borderRadius="xl" mb={5} overflow="hidden" shadow="sm" bg="gray.50">

                            <AccordionButton _expanded={{ bg: 'white', borderBottom: '1px solid', borderColor: 'gray.100' }} p={4}>
                                <Box as="span" flex="1" textAlign="left" fontWeight="bold" fontSize="md" color="gray.700">
                                    {section.title}
                                </Box>
                                <AccordionIcon color="purple.500" />
                            </AccordionButton>

                            <AccordionPanel pb={5} pt={4} bg="white">
                                <VStack spacing={4} align="stretch" divider={<StackDivider borderColor="gray.100" />}>
                                    {section.fields?.map((field) => {
                                        const isCheckbox = field.field_type === 'checkbox';
                                        const isFieldInEditMode = editingFields[field.id];
                                        const showAsInput = !isSavedReport || isFieldInEditMode;

                                        return (
                                            <Box key={field.id} py={2}>
                                                {showAsInput ? (
                                                    <FormControl isRequired={field.required}>
                                                        <HStack justify="space-between" align="end" spacing={4}>
                                                            <Box flex="1">
                                                                {!isCheckbox && (
                                                                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                                                                        {field.label}
                                                                    </FormLabel>
                                                                )}
                                                                {renderFieldInput(field)}
                                                            </Box>
                                                            {isSavedReport && isFieldInEditMode && (
                                                                <IconButton
                                                                    aria-label="Valider la saisie temporaire"
                                                                    icon={<FiCheck />}
                                                                    colorScheme="green"
                                                                    size="sm"
                                                                    onClick={() => toggleEditField(field.id)}
                                                                />
                                                            )}
                                                        </HStack>
                                                    </FormControl>
                                                ) : (
                                                    <HStack justify="space-between" align="start" p={2} borderRadius="md" _hover={{ bg: "gray.50" }} role="group" transition="all 0.2s">
                                                        <VStack align="stretch" spacing={1} flex="1">
                                                            <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase">
                                                                {field.label} {field.required && <Text as="span" color="red.500">*</Text>}
                                                            </Text>
                                                            <Box pl={1}>
                                                                {renderValueReadOnly(field)}
                                                            </Box>
                                                        </VStack>

                                                        <IconButton
                                                            className="edit-button"
                                                            aria-label="Modifier le champ"
                                                            icon={<FiEdit2 />}
                                                            size="xs"
                                                            variant="ghost"
                                                            colorScheme="purple"
                                                            opacity={0}
                                                            _groupHover={{ opacity: 1 }}
                                                            onClick={() => toggleEditField(field.id)}
                                                        />
                                                    </HStack>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </VStack>
                            </AccordionPanel>
                        </AccordionItem>
                    ))}
                </Accordion>

                <Button
                    colorScheme="purple"
                    onClick={saveFields}
                    isLoading={loadingSave}
                    alignSelf="flex-end"
                    size="lg"
                    px={8}
                    shadow="md"
                >
                    {isSavedReport ? "Mettre à jour le rapport" : "Valider et fermer le rapport"}
                </Button>
            </VStack>
        </Box>
    );
}