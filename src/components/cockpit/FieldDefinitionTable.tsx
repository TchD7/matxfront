import {
    Box, Flex, VStack, HStack, Button, Text, Input, Select, Switch,
    Heading, SimpleGrid, IconButton, useToast, Badge, Divider, Stack, useDisclosure
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiCloudLightning } from 'react-icons/fi';
import api from '../../api/apiClient';
import FieldDefinitionModal from './FieldDefinitionModal';

interface FieldTypes {
    value: string;
    label: string;
}

interface InterventionType {
    id: string | number;
    name: string;
}

interface Section {
    id: string | number;
    title: string;
    fields: FieldDefinition[];
}

interface FieldDefinition {
    id: string | number;
    label: string;
    field_type: string;
    required: boolean;
    code: string;
    order?: number;
}

// Aligné à 100% avec les choices de ton modèle Django
const FIELD_TYPES: FieldTypes[] = [
    { value: "text", label: "Texte" },
    { value: "textarea", label: "Zone de texte (Multi-lignes)" },
    { value: "number", label: "Numérique" },
    { value: "checkbox", label: "Case à cocher" },
    { value: "date", label: "Date" },
    { value: "time", label: "Heure" },
    { value: "datetime", label: "Date & Heure" },
    { value: "select", label: "Liste déroulante" },
    { value: "multi_select", label: "Sélection multiple" },
    { value: "radio", label: "Bouton radio" },
    { value: "image", label: "Photo Appareil" },
    { value: "file", label: "Fichier / Doc" },
    { value: "signature", label: "Signature" },
];

export default function FieldDefinitionTable() {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string | number>('');
    const [sections, setSections] = useState<Section[]>([]);
    const [isDeploying, setIsDeploying] = useState<Record<string | number, boolean>>({});

    const fieldCounterRef = useRef(0);

    const fetchInterventionTypes = () => {
        api.get('/api/v1/intervention-types/').then(res => {
            const data = res.data.results || res.data;
            setInterventionTypes(data);
            if (data.length > 0) setSelectedTypeId(data[0].id);
        });
    };

    const fetchSectionsAndFields = () => {

        console.log("CHANGEMENT DE TYPE DÉTECTÉ, ID ACTUEL :", selectedTypeId);
        // 💡 1. On vide tout de suite l'affichage de droite dès qu'on change de type
        setSections([]);

        if (!selectedTypeId) return;

        api.get(`/api/v1/sections/?intervention_type=${selectedTypeId}`).then(res => {
            const sectionsData = res.data.results || res.data;

            const promises = sectionsData.map((section: any) =>
                api.get(`/api/v1/field-definitions/?section_id=${section.id}`)
                    .then(fieldRes => {
                        const fields = fieldRes.data.results || fieldRes.data;
                        return {
                            id: section.id,
                            title: section.title,
                            fields: fields.sort((a: any, b: any) => a.order - b.order)
                        };
                    })
            );
-
            Promise.all(promises).then((completedSections) => {
                setSections(completedSections);
            });
        }).catch(err => {
            console.error("Erreur lors de la récupération des sections:", err);
            setSections([]);
        });
    };

    useEffect(() => {
        fetchInterventionTypes();
    }, []);

    useEffect(() => {
        fetchSectionsAndFields();
    }, [selectedTypeId]);

    const addFieldToSectionLocal = (sectionId: string | number) => {
        fieldCounterRef.current += 1;
        const tempFieldId = `temp-fld-${Date.now()}-${fieldCounterRef.current}`;

        setSections(sections.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                fields: [...sec.fields, {
                    id: tempFieldId,
                    label: "",
                    field_type: "text",
                    required: false,
                    code: `param_${Date.now().toString().slice(-3)}${fieldCounterRef.current}`
                }]
            };
        }));
    };

    const removeFieldFromSectionLocal = (sectionId: string | number, fieldId: string | number) => {
        setSections(sections.map(sec => {
            if (sec.id !== sectionId) return sec;
            return { ...sec, fields: sec.fields.filter(f => f.id !== fieldId) };
        }));
    };

    const updateFieldLocal = (sectionId: string | number, fieldId: string | number, key: keyof FieldDefinition, value: any) => {
        setSections(sections.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                fields: sec.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f)
            };
        }));
    };

    const moveFieldLocal = (sectionId: string | number, index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        setSections(sections.map(sec => {
            if (sec.id !== sectionId) return sec;
            if (targetIndex < 0 || targetIndex >= sec.fields.length) return sec;

            const updatedFields = [...sec.fields];
            const temp = updatedFields[index];
            updatedFields[index] = updatedFields[targetIndex];
            updatedFields[targetIndex] = temp;

            return { ...sec, fields: updatedFields };
        }));
    };

    const removeSectionLocal = async (sectionId: string | number) => {
        if (!window.confirm("Supprimer cette section ? Tous les champs locaux rattachés seront supprimés.")) return;
        try {
            if (!String(sectionId).startsWith('temp-sec-')) {
                await api.delete(`/api/v1/sections/${sectionId}/`);
            }
            setSections(sections.filter(s => s.id !== sectionId));
            toast({ title: "Section supprimée", status: "success", duration: 2000 });
        } catch (err) {
            toast({ title: "Erreur lors de la suppression", status: "error" });
        }
    };

    const handleDeploySection = async (section: Section) => {
        const hasInvalidFields = section.fields.some(f => !f.label.trim() || !f.code.trim());
        if (hasInvalidFields) {
            toast({ title: "Champs incomplets", description: "Remplissez l'intitulé et le code API avant de déployer.", status: "warning", duration: 3000 });
            return;
        }

        try {
            setIsDeploying(prev => ({ ...prev, [section.id]: true }));

            const fieldsToDeploy = section.fields.map((field, index) => {
                const isTempField = String(field.id).startsWith('temp-fld-');
                return {
                    ...(isTempField ? {} : { id: field.id }),
                    label: field.label,
                    field_type: field.field_type,
                    required: field.required,
                    code: field.code,
                    order: index
                };
            });

            await api.post('/api/v1/field-definitions/deploy/', {
                section_id: section.id,
                fields: fieldsToDeploy
            });

            toast({ title: `Section "${section.title}" synchronisée !`, status: "success", duration: 3000 });
            fetchSectionsAndFields();
        } catch (err: any) {
            toast({ title: "Échec du déploiement", description: err.response?.data?.detail || "Erreur de validation", status: "error" });
        } finally {
            setIsDeploying(prev => ({ ...prev, [section.id]: false }));
        }
    };

    return (
        <SimpleGrid columns={{ base: 1, lg: 4 }} gap={6} p={{ base: 3, md: 5 }} width="100%">

            {/* PANNEAU GAUCHE */}
            <Box bg="white" p={4} borderRadius="xl" boxShadow="sm" border="1px solid #eee" h="fit-content">
                <Heading size="xs" textTransform="uppercase" color="gray.400" mb={4}>
                    Types d'interventions
                </Heading>
                <Stack direction={{ base: "row", lg: "column" }} spacing={2} overflowX={{ base: "auto", lg: "visible" }} pb={{ base: 2, lg: 0 }}>
                    {interventionTypes.map(type => {
                        const isSelected = selectedTypeId === type.id;
                        return (
                            <Box
                                key={type.id} p={3} borderRadius="lg" cursor="pointer" inlineSize={{ base: "max-content", lg: "auto" }}
                                bg={isSelected ? "purple.50" : "transparent"}
                                color={isSelected ? "purple.700" : "gray.700"}
                                fontWeight={isSelected ? "bold" : "normal"}
                                _hover={{ bg: "gray.50" }}
                                onClick={() => setSelectedTypeId(type.id)}
                            >
                                {type.name}
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* WORKSPACE DROITE */}
            <Box gridColumn={{ base: "span 1", lg: "span 3" }} bg="white" p={{ base: 4, md: 5 }} borderRadius="xl" boxShadow="sm" border="1px solid #eee" width="100%">
                <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "stretch", sm: "center" }} gap={4} mb={6}>
                    <Box>
                        <Heading size="md">Champs structurés par section</Heading>
                        <Text fontSize="xs" color="gray.500">Configurez et déployez vos blocs de rapports de terrain.</Text>
                    </Box>
                    <Button leftIcon={<FiPlus />} size="sm" colorScheme="purple" variant="outline" onClick={onOpen}>
                        Nouvelle Section
                    </Button>
                </Flex>

                <Divider mb={6} />

                <VStack spacing={8} align="stretch">
                    {sections.length === 0 && (
                        <Box py={10} textAlign="center" color="gray.400" border="2px dashed #eee" borderRadius="lg">
                            Aucune section trouvée. Cliquez sur "Nouvelle Section".
                        </Box>
                    )}

                    {sections.map((section) => (
                        <Box key={section.id} p={4} border="1px solid" borderColor="purple.100" borderRadius="xl" bg="white">

                            <Flex justify="space-between" align="center" mb={4} bg="purple.50" p={2} borderRadius="lg">
                                <HStack spacing={3}>
                                    <Text fontWeight="bold" color="purple.700" fontSize="sm">📂 {section.title}</Text>
                                    <Badge colorScheme="purple">{section.fields.length} champs</Badge>
                                </HStack>
                                <HStack spacing={2}>
                                    <Button
                                        leftIcon={<FiCloudLightning />} size="xs" colorScheme="purple"
                                        isLoading={isDeploying[section.id]} onClick={() => handleDeploySection(section)}
                                        isDisabled={section.fields.length === 0}
                                    >
                                        Déployer la section
                                    </Button>
                                    <IconButton aria-label="Supprimer" icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => removeSectionLocal(section.id)} />
                                </HStack>
                            </Flex>

                            <VStack spacing={3} align="stretch" mb={4}>
                                {section.fields.map((field, index) => (
                                    <Stack key={field.id} direction={{ base: "column", md: "row" }} p={3} bg="gray.50" borderRadius="lg" spacing={3} align="center">
                                        <Badge colorScheme="purple">#{index + 1}</Badge>

                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3} flex={1}>
                                            <Input size="sm" bg="white" placeholder="Intitulé" value={field.label} onChange={(e) => updateFieldLocal(section.id, field.id, 'label', e.target.value)} />
                                            <Input size="sm" bg="white" placeholder="Code unique API" value={field.code} onChange={(e) => updateFieldLocal(section.id, field.id, 'code', e.target.value)} />
                                            <Select size="sm" bg="white" value={field.field_type} onChange={(e) => updateFieldLocal(section.id, field.id, 'field_type', e.target.value)}>
                                                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </Select>
                                            <Flex align="center" justify="center">
                                                <Text fontSize="xs" color="gray.500" mr={2}>Obligatoire ?</Text>
                                                <Switch size="sm" colorScheme="purple" isChecked={field.required} onChange={(e) => updateFieldLocal(section.id, field.id, 'required', e.target.checked)} />
                                            </Flex>
                                        </SimpleGrid>

                                        <HStack spacing={1}>
                                            <IconButton aria-label="Monter" size="xs" icon={<FiArrowUp />} isDisabled={index === 0} onClick={() => moveFieldLocal(section.id, index, 'up')} />
                                            <IconButton aria-label="Descendre" size="xs" icon={<FiArrowDown />} isDisabled={index === section.fields.length - 1} onClick={() => moveFieldLocal(section.id, index, 'down')} />
                                            <IconButton aria-label="Supprimer" size="xs" colorScheme="red" variant="ghost" icon={<FiTrash2 />} onClick={() => removeFieldFromSectionLocal(section.id, field.id)} />
                                        </HStack>
                                    </Stack>
                                ))}
                            </VStack>

                            <Button leftIcon={<FiPlus />} size="xs" colorScheme="purple" variant="ghost" onClick={() => addFieldToSectionLocal(section.id)}>
                                Ajouter un champ à "{section.title}"
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
                currentSectionsCount={sections.length} // Passe la taille actuelle pour l'incrément de l'order
                onSuccess={fetchSectionsAndFields}
            />
        </SimpleGrid>
    );
}