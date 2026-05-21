import {
    Box,
    VStack,
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
    // Importation des composants d'accordéon de Chakra UI
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon
} from '@chakra-ui/react';

import { useState, useEffect } from 'react';
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

// ================= COMPONENT =================
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

    // ================= FETCH ALL DATA =================
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

            const [sectionsRes, valuesRes] = await Promise.all([
                api.get(`/api/v1/sections/?intervention_type=${interventionTypeId}`),
                api.get(`/api/v1/ticket-field-values/?ticket=${ticket.id}`)
            ]);

            const sectionsData = sectionsRes.data.results || sectionsRes.data;
            const existingValuesData = valuesRes.data.results || valuesRes.data;

            const sectionPromises = sectionsData.map((section: any) =>
                api.get(`/api/v1/field-definitions/?section_id=${section.id}`)
                    .then(fieldRes => {
                        const fields = fieldRes.data.results || fieldRes.data;
                        return {
                            id: section.id,
                            title: section.title,
                            fields: fields.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        };
                    })
            );

            const completedSections = await Promise.all(sectionPromises);
            setSections(completedSections);

            const initialValues: Record<string, any> = {};
            const recordIds: Record<string, string | number> = {};

            completedSections.forEach((sec: Section) => {
                sec.fields.forEach((field) => {
                    initialValues[field.id] = field.field_type === 'checkbox' ? false : '';
                });
            });

            if (Array.isArray(existingValuesData)) {
                existingValuesData.forEach((item: any) => {
                    const fieldId = typeof item.field_definition === 'object'
                        ? item.field_definition?.id
                        : item.field_definition;

                    if (fieldId) {
                        initialValues[fieldId] = item.value;
                        recordIds[fieldId] = item.id;
                    }
                });
            }

            setValues(initialValues);
            setValueRecordIds(recordIds);

        } catch (err) {
            console.error("Erreur lors de l'initialisation du formulaire :", err);
            toast({
                title: "Erreur",
                description: "Impossible de charger la configuration de ce formulaire.",
                status: "error",
                duration: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDynamicForm();
    }, [ticket?.id, ticket?.intervention_type]);

    // ================= HANDLE CHANGE =================
    const handleChange = (fieldId: string | number, value: any) => {
        setValues((prev) => ({
            ...prev,
            [fieldId]: value,
        }));
    };

    // ================= SAVE VALUES =================
    const saveFields = async () => {
        try {
            setLoadingSave(true);

            const savePromises = Object.entries(values).map(([fieldId, val]) => {
                const existingRecordId = valueRecordIds[fieldId];

                const payload = {
                    ticket: ticket.id,
                    field_definition: fieldId,
                    value: val
                };

                if (existingRecordId) {
                    return api.patch(`/api/v1/ticket-field-values/${existingRecordId}/`, { value: val });
                } else {
                    return api.post(`/api/v1/ticket-field-values/`, payload);
                }
            });

            await Promise.all(savePromises);

            toast({
                title: 'Rapport enregistré',
                status: 'success',
                duration: 2000,
            });

            loadDynamicForm();
            onRefresh();

        } catch (err: any) {
            console.error("Erreur lors de la sauvegarde :", err);
            toast({
                title: 'Erreur de sauvegarde',
                description: err.response?.data?.detail || 'Vérifiez la saisie des champs obligatoires.',
                status: 'error',
            });
        } finally {
            setLoadingSave(false);
        }
    };

    // ================= RENDER FIELD =================
    const renderField = (field: FieldDefinition) => {
        const value = values[field.id] ?? '';

        switch (field.field_type) {
            case 'text':
                return <Input value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
            case 'number':
                return <Input type="number" value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
            case 'textarea':
                return <Textarea value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
            case 'select':
                return (
                    <Select value={value} onChange={(e) => handleChange(field.id, e.target.value)}>
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
                    <Checkbox isChecked={!!value} onChange={(e) => handleChange(field.id, e.target.checked)} colorScheme="purple">
                        {field.label}
                    </Checkbox>
                );
            case 'date':
                return <Input type="date" value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
            case 'time':
                return <Input type="time" value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
            default:
                return <Input value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
        }
    };

    // ================= LOADING GUARDS =================
    if (!ticket) {
        return (
            <Center py={10} flexDir="column" gap={3}>
                <Spinner color="purple.500" size="xl" thickness="4px" />
                <Text color="gray.500" fontSize="sm">Attente du ticket...</Text>
            </Center>
        );
    }

    if (loading) {
        return (
            <Center py={10} flexDir="column" gap={3}>
                <Spinner color="purple.500" size="xl" thickness="4px" />
                <Text color="gray.500" fontSize="sm">Génération de vos champs personnalisés...</Text>
            </Center>
        );
    }

    if (sections.length === 0) {
        return (
            <Center py={10} flexDir="column" p={6} bg="gray.50" borderRadius="lg" border="1px dashed" borderColor="gray.200">
                <Text fontWeight="bold" color="gray.600" mb={1}>Aucun champ paramétré</Text>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                    Aucune section de formulaire n'est associée au type d'intervention de ce ticket.
                </Text>
            </Center>
        );
    }

    // ================= UI =================
    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">

                {/* 
                  allowMultiple: Permet d'ouvrir plusieurs sections en même temps.
                  allowToggle: Permet de refermer une section en recliquant dessus.
                */}
                <Accordion allowMultiple>
                    {sections.map((section) => (
                        <AccordionItem key={section.id} border="1px solid" borderColor="gray.200" borderRadius="md" mb={4} overflow="hidden">

                            {/* Bouton de l'encoche cliquable */}
                            <AccordionButton _expanded={{ bg: 'purple.50', color: 'purple.700' }} p={4}>
                                <Box as="span" flex="1" textAlign="left" fontWeight="bold" fontSize="md">
                                    📂 {section.title}
                                </Box>
                                <AccordionIcon color="purple.500" />
                            </AccordionButton>

                            {/* Contenu masqué/affiché */}
                            <AccordionPanel pb={5} pt={4} bg="white">
                                <VStack spacing={5} align="stretch">
                                    {section.fields?.map((field) => {
                                        const isCheckbox = field.field_type === 'checkbox';

                                        return (
                                            <FormControl key={field.id} isRequired={field.required}>
                                                {!isCheckbox && (
                                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.600">
                                                        {field.label}
                                                    </FormLabel>
                                                )}
                                                {renderField(field)}
                                            </FormControl>
                                        );
                                    })}
                                </VStack>
                            </AccordionPanel>

                        </AccordionItem>
                    ))}
                </Accordion>

                {/* SAVE BUTTON */}
                <Button
                    colorScheme="purple"
                    onClick={saveFields}
                    isLoading={loadingSave}
                    alignSelf="flex-end"
                    size="lg"
                    shadow="sm"
                >
                    Sauvegarder les modifications
                </Button>
            </VStack>
        </Box>
    );
}