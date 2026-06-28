import React, { useMemo } from 'react';
import {
    SimpleGrid,
    Heading,
    Text,
    VStack,
    Box,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
} from '@chakra-ui/react';

import type { RenderedSection } from '../tickets/types/formDynamicTypes';
//import { FieldDefinition } from '../tickets/types/formDynamicTypes';
import { FieldFactory } from '../tickets/fields/FieldFactory';

interface RenderFormRendererProps {
    sections: RenderedSection[];
    values: Record<number, unknown>;
    isEditing: boolean;
    onChange: (fieldId: number, value: unknown) => void;
}

export const RenderFormRenderer: React.FC<RenderFormRendererProps> = ({
    sections,
    values, // Note: si values contient déjà les données brutes de l'API, on n'en a même plus besoin ici pour initialiser, mais on le garde pour les mises à jour.
    isEditing,
    onChange,
}) => {
    const computedSections = useMemo(() => {
        if (!sections) return [];
        return sections
            .map(section => {
                // On mappe les champs pour gérer l'objet "file" provenant de l'API
                const mappedFields = (section.fields || []).map((f: any) => {

                    // --- LA CORRECTION EST ICI ---
                    // Si c'est un champ média et qu'il y a un objet file avec une url
                    let correctValue = f.value;
                    if (['image', 'file', 'signature'].includes(f.type || f.field_type) && f.file?.url) {
                        correctValue = f.file.url;
                    }

                    // On retourne le champ en forçant la bonne valeur
                    return {
                        ...f,
                        // On donne la priorité à la valeur locale "values" (si l'utilisateur a modifié), 
                        // sinon on prend la valeur corrigée (URL de l'image)
                        value: values[f.id] !== undefined ? values[f.id] : correctValue
                    };
                });

                return {
                    ...section,
                    visibleFields: mappedFields.filter(f => f.visible)
                };
            })
            .filter(section => section.visibleFields.length > 0);
    }, [sections, values]); // N'oubliez pas d'ajouter "values" aux dépendances

    // ... (le reste de votre code reste identique à partir de if (computedSections.length === 0))

    if (computedSections.length === 0) {
        return (
            <Box
                textAlign="center"
                py={10}
                borderWidth="1px"
                borderStyle="dashed"
                borderRadius="lg"
                bg="gray.50"
            >
                <Text color="gray.500" fontSize="sm">
                    Aucun champ disponible
                </Text>
            </Box>
        );
    }

    const defaultExpandedIndices = computedSections.map((_, index) => index);

    return (
        <Accordion allowMultiple defaultIndex={defaultExpandedIndices} w="100%">
            <VStack spacing={6} align="stretch" w="100%">
                {computedSections.map((section) => (
                    <AccordionItem
                        key={section.section_id}
                        borderWidth="1px" borderRadius="xl" borderColor="gray.200" boxShadow="sm" bg="white" overflow="hidden"
                    >
                        <h2>
                            <AccordionButton bg="gray.50" _hover={{ bg: 'gray.100' }} py={4} px={5}>
                                <Box flex="1" textAlign="left">
                                    <Heading size="sm" color="gray.800">{section.section_title}</Heading>
                                    {section.section_description && (
                                        <Text fontSize="xs" color="gray.500" mt={1}>{section.section_description}</Text>
                                    )}
                                </Box>
                                <AccordionIcon color="gray.500" />
                            </AccordionButton>
                        </h2>

                        <AccordionPanel pb={6} pt={6} px={5} borderTop="1px solid" borderColor="gray.100">
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={8} spacingY={2}>
                                {section.visibleFields.map((field) => (
                                    <Box key={field.id} w="100%">
                                        <FieldFactory
                                            field={field}
                                            isEditing={isEditing}
                                            onChange={onChange}
                                        />
                                    </Box>
                                ))}
                            </SimpleGrid>
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </VStack>
        </Accordion>
    );
};

