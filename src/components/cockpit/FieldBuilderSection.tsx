import { useState, useEffect, useCallback, useRef } from 'react';
import {
    SimpleGrid, Box, VStack, Heading, Flex, Text, Button, HStack,
    useDisclosure, useToast, Icon
} from '@chakra-ui/react';
import { FiPlus, FiLayers, FiFileText } from 'react-icons/fi';

import { FieldDefinitionModal } from './FieldDefinitionModal';
import api from '../../api/apiClient';
import SectionAccordion from './SectionAccordion';
import FormVersionSelector from './FormVersionSelector';

export default function FieldBuilderSection() {
    const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string | number>('');
    const [formVersionId, setFormVersionId] = useState<string | number | null>(null);
    const [sections, setSections] = useState<any[]>([]);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [modalMode, setModalMode] = useState<'section' | 'field'>('section');
    const [editingField, setEditingField] = useState<any>(null);
    const [activeSectionId, setActiveSectionId] = useState<string | number | null>(null);

    const toast = useToast();
    const requestIdRef = useRef(0);

    // =====================
    // INITIAL LOAD
    // =====================
    useEffect(() => {
        api.get('/api/v1/intervention-types/')
            .then((res) => {
                const data = res.data.results || res.data;
                setInterventionTypes(data);
                if (data.length > 0) setSelectedTypeId(data[0].id);
            })
            .catch(() => toast({ title: "Erreur chargement types", status: "error" }));
    }, [toast]);

    // =====================
    // FETCH STRUCTURE
    // =====================
    const fetchStructure = useCallback(async (typeId: any, versionId: any) => {
        if (!typeId) return;
        const requestId = ++requestIdRef.current;

        try {
            const url = versionId
                ? `/api/v1/sections/?intervention_type=${typeId}&form_version=${versionId}`
                : `/api/v1/sections/?intervention_type=${typeId}`;

            const res = await api.get(url);
            const data = res.data.results || res.data;

            if (requestId !== requestIdRef.current) return;
            setSections(data);
        } catch (err) {
            console.error("Erreur structure:", err);
        }
    }, []);

    useEffect(() => {
        if (selectedTypeId) fetchStructure(selectedTypeId, formVersionId);
    }, [selectedTypeId, formVersionId, fetchStructure]);

    // =====================
    // ACTIONS LOCALES
    // =====================
    const refreshData = () => fetchStructure(selectedTypeId, formVersionId);

    const handleUpdateFieldLocal = async (sectionId: any, fieldId: any, key: string, value: any) => {
        console.log("DEBUG: Début de la mise à jour");
        console.log("Params -> Section:", sectionId, "Field:", fieldId, "Key:", key, "Value:", value);

        setSections(prev => prev.map(sec =>
            sec.id !== sectionId ? sec : {
                ...sec,
                fields: sec.fields.map((f: any) => f.id === fieldId ? { ...f, [key]: value } : f)
            }
        ));

        try {
            console.log("DEBUG: Tentative d'appel API...");
            const response = await api.patch(`/api/v1/field-definitions/${fieldId}/`, { [key]: value });
            console.log("DEBUG: Succès API !", response.data);
            toast({ title: "Sauvegardé", status: "success", duration: 1000 });
        } catch (error: any) {
            console.error("DEBUG: Erreur API !", error.response?.data || error);
            toast({ title: "Erreur sauvegarde", status: "error" });
        }
    };

    const handleMoveFieldLocal = (sectionId: any, index: number, direction: 'up' | 'down') => {
        setSections(prev => prev.map(sec => {
            if (sec.id !== sectionId) return sec;
            const updated = [...sec.fields];
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target < 0 || target >= updated.length) return sec;
            [updated[index], updated[target]] = [updated[target], updated[index]];
            return { ...sec, fields: updated };
        }));
    };

    const handleDeleteSection = async (sectionId: any) => {
        await api.delete(`/api/v1/sections/${sectionId}/`);
        refreshData();
    };

    const handleDeploySection = async (sectionId: any) => {
        await api.post('/api/v1/sections/deploy/', { section_id: sectionId });
        refreshData();
    };

    const handleDeleteFieldLocal = async (fieldId: any) => {
        await api.delete(`/api/v1/field-definitions/${fieldId}/`);
        refreshData();
    };

    // =====================
    // MODALS
    // =====================
    const openFieldModal = (sectionId: any, field: any = null) => {
        setModalMode('field');
        setEditingField(field);
        setActiveSectionId(sectionId);
        onOpen();
    };

    // 🔄 MODIFICATION ICI : On adapte pour recevoir une section en édition
    const openSectionModal = (section: any = null) => {
        setModalMode('section');
        // On passe les données existantes de la section à 'editingField' ou 'fieldData' 
        // pour que ton FieldDefinitionModal sache s'il doit faire un POST ou un PUT/PATCH
        setEditingField(section);
        setActiveSectionId(section ? section.id : null);
        onOpen();
    };

    return (
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={6} alignItems="start">
            <Box bg="white" p={4} borderRadius="xl" border="1px solid #E2E8F0">
                <Heading size="xs" mb={4} color="gray.500">
                    <Icon as={FiLayers} mr={2} /> Types
                </Heading>
                <VStack align="stretch">
                    {interventionTypes.map(type => (
                        <Box key={type.id} p={3} cursor="pointer" bg={selectedTypeId === type.id ? 'purple.50' : 'transparent'} onClick={() => setSelectedTypeId(type.id)}>
                            <HStack><Icon as={FiFileText} /><Text fontSize="sm">{type.name}</Text></HStack>
                        </Box>
                    ))}
                </VStack>
            </Box>

            <Box gridColumn={{ md: 'span 3' }} bg="white" p={5} borderRadius="xl" border="1px solid #E2E8F0">
                <Flex justify="space-between" mb={1}>
                    <Heading size="md">Form Builder</Heading>
                    <HStack>
                        {selectedTypeId && (
                            <FormVersionSelector
                                key={selectedTypeId}
                                interventionTypeId={selectedTypeId}
                                onVersionChange={(id) => setFormVersionId(id)}
                            />
                        )}
                        <Button colorScheme="purple" size="sm" onClick={() => openSectionModal(null)}>Nouvelle section</Button>
                    </HStack>
                </Flex>

                {/* 🎯 AJOUT DE LA PROP ICI */}
                <SectionAccordion
                    sections={sections}
                    openSectionModal={openSectionModal} // 👈 Relié au handler parent modifié
                    openFieldModal={openFieldModal}
                    handleUpdateFieldLocal={handleUpdateFieldLocal}
                    handleMoveFieldLocal={handleMoveFieldLocal}
                    handleDeleteFieldLocal={handleDeleteFieldLocal}
                    handleDeleteSection={handleDeleteSection}
                    handleDeploySection={handleDeploySection}
                />
            </Box>

            <FieldDefinitionModal
                isOpen={isOpen}
                onClose={onClose}
                mode={modalMode}
                sectionId={activeSectionId}
                fieldData={editingField} // Recevra soit le champ, soit la section complète
                interventionTypeId={selectedTypeId}
                formVersionId={formVersionId}
                onSuccess={refreshData}
            />
        </SimpleGrid>
    );
}