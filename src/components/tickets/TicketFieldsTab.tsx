import {
    Box,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Select,
    Checkbox,
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
    Divider
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

    // Mode d'édition global ou par champ
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

            // Si des données existent déjà, on passe directement en mode affichage Rapport
            setIsSavedReport(!isNewForm);

            const completedSections = sectionsData.map((section: any) => {
                let sectionFields = [];

                if (isNewForm) {
                    sectionFields = allFieldsData
                        .filter((field: any) => {
                            const fSectionId = typeof field.section === 'object' ? field.section?.id : (field.section || field.section_id);
                            return String(fSectionId) === String(section.id);
                        })
                        .map((field: any) => ({
                            id: field.id,
                            value_id: null,
                            code: field.code,
                            label: field.label,
                            field_type: field.field_type,
                            required: field.required ?? false,
                            options: field.options || [],
                            order: field.order || 0
                        }));
                } else {
                    sectionFields = existingValuesData
                        .filter((item: any) => {
                            const currentFieldId = item.field_id || item.field_definition_id || (typeof item.field_definition === 'object' ? item.field_definition?.id : item.field_definition);
                            const matchingDef = allFieldsData.find((f: any) => String(f.id) === String(currentFieldId));

                            if (matchingDef) {
                                const defSectionId = typeof matchingDef.section === 'object' ? matchingDef.section?.id : (matchingDef.section || matchingDef.section_id);
                                return String(defSectionId) === String(section.id);
                            }

                            const firstSectionId = sectionsData[0]?.id;
                            return String(section.id) === String(firstSectionId);
                        })
                        .map((item: any) => {
                            const currentFieldId = item.field_id || item.field_definition_id || (typeof item.field_definition === 'object' ? item.field_definition?.id : item.field_definition);
                            return {
                                id: currentFieldId,
                                value_id: item.id,
                                code: item.code || item.field_code || `param_${currentFieldId}`,
                                label: item.label || item.field_label || `Champ #${currentFieldId}`,
                                field_type: item.field_type || 'text',
                                required: item.required ?? false,
                                options: item.options || [],
                                order: item.order || 0
                            };
                        });
                }

                return {
                    id: section.id,
                    title: section.title,
                    fields: sectionFields.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                };
            });

            setSections(completedSections);

            const initialValues: Record<string, any> = {};
            const recordIds: Record<string, string | number> = {};

            if (isNewForm) {
                completedSections.forEach((sec: any) => {
                    sec.fields.forEach((field: any) => {
                        initialValues[field.id] = field.field_type === 'checkbox' ? false : '';
                    });
                });
            } else {
                existingValuesData.forEach((item: any) => {
                    const fieldId = item.field_id || item.field_definition_id || (typeof item.field_definition === 'object' ? item.field_definition?.id : item.field_definition);
                    if (fieldId) {
                        initialValues[fieldId] = item.value ?? (item.field_type === 'checkbox' ? false : '');
                        recordIds[fieldId] = item.id;
                    }
                });
            }

            setValues(initialValues);
            setValueRecordIds(recordIds);

        } catch (err) {
            console.error("❌ Erreur lors de la reconstruction du formulaire :", err);
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
        try {
            setLoadingSave(true);
            const savePromises = Object.entries(values).map(([fieldId, val]) => {
                const existingRecordId = valueRecordIds[fieldId];
                if (existingRecordId) {
                    return api.patch(`/api/v1/ticket-field-values/${existingRecordId}/`, { value: val });
                } else {
                    return api.post(`/api/v1/ticket-field-values/`, {
                        ticket: ticket.id,
                        field_definition: fieldId,
                        value: val
                    });
                }
            });
            await Promise.all(savePromises);
            toast({ title: 'Rapport enregistré avec succès', status: 'success', duration: 2000 });

            setEditingFields({});
            setIsSavedReport(true);

            loadDynamicForm();
            onRefresh();
        } catch (err: any) {
            console.error("Erreur de sauvegarde :", err);
            toast({ title: 'Erreur lors de la sauvegarde', status: 'error', duration: 3000 });
        } finally {
            setLoadingSave(false);
        }
    };

    const renderFieldInput = (field: FieldDefinition) => {
        const value = values[field.id] ?? '';
        switch (field.field_type) {
            case 'text':
                return <Input bg="white" value={value} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
            case 'number':
                return <Input bg="white" type="number" value={value} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
            case 'textarea':
                return <Textarea bg="white" value={value} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" rows={3} />;
            case 'select':
                return (
                    <Select bg="white" value={value} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md">
                        <option value="">-- choisir --</option>
                        {field.options?.map((opt: any, idx: number) => (
                            <option key={idx} value={opt.value ?? opt}>
                                {opt.label ?? opt}
                            </option>
                        ))}
                    </Select>
                );
            case 'checkbox':
                return (
                    <Checkbox isChecked={!!value} onChange={(e) => handleChange(field.id, e.target.checked)} colorScheme="purple" size="md">
                        {field.label}
                    </Checkbox>
                );
            case 'date':
                return <Input bg="white" type="date" value={value} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
            case 'time':
                return <Input bg="white" type="time" value={value} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
            default:
                return <Input bg="white" value={value} onChange={(e) => handleChange(field.id, e.target.value)} size="sm" borderRadius="md" />;
        }
    };

    // Formatage propre pour la lecture du rapport final
    const renderValueReadOnly = (field: FieldDefinition) => {
        const rawValue = values[field.id];

        if (field.field_type === 'checkbox') {
            return (
                <Badge colorScheme={rawValue ? "green" : "gray"} variant="subtle" px={2} py={0.5} borderRadius="md">
                    {rawValue ? "Oui / Validé" : "Non / Non applicable"}
                </Badge>
            );
        }

        if (!rawValue && rawValue !== 0) {
            return <Text color="gray.400" as="span" fontSize="sm" fontStyle="italic">Non renseigné</Text>;
        }

        return <Text color="gray.800" fontWeight="medium" fontSize="sm" whiteSpace="pre-line">{rawValue}</Text>;
    };

    if (!ticket) return <Center py={10}><Spinner color="purple.500" /></Center>;
    if (loading) return <Center py={10} flexDir="column" gap={3}><Spinner color="purple.500" size="xl" /><Text color="gray.500" fontSize="sm">Chargement du rapport technique...</Text></Center>;
    if (sections.length === 0) return <Center py={10}><Text>Aucune section configurée.</Text></Center>;

    return (
        <Box p={4} maxW="4xl" mx="auto">
            <VStack spacing={6} align="stretch">

                {/* En-tête mode Rapport */}
                {isSavedReport && (
                    <HStack bg="purple.50" borderLeft="4px solid" borderColor="purple.500" p={3} borderRadius="r-md" justifyContent="between" w="100%">
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
                                <VStack spacing={4} align="stretch" separator={<Divider borderColor="gray.50" />}>
                                    {section.fields?.map((field) => {
                                        const isCheckbox = field.field_type === 'checkbox';
                                        const isFieldInEditMode = editingFields[field.id];
                                        const showAsInput = !isSavedReport || isFieldInEditMode;

                                        return (
                                            <Box key={field.id} py={2}>
                                                {showAsInput ? (
                                                    /* --- MODE EDITION / INPUTS STANDARD --- */
                                                    <FormControl isRequired={field.required}>
                                                        <HStack justify="space-between" align="end" spacing={4}>
                                                            <Box flex="1">
                                                                {!isCheckbox && (
                                                                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" tracking="wider" mb={1}>
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
                                                    /* --- MODE RAPPORT VERROUILLÉ / LECTURE SEULE --- */
                                                    <HStack justify="space-between" align="start" p={2} borderRadius="md" _hover={{ bg: "gray.50" }} role="group" transition="all 0.2s">
                                                        <VStack align="stretch" spacing={1} flex="1">
                                                            <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase">
                                                                {field.label}
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

                {/* Bouton global de validation */}
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