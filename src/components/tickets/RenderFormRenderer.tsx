import React, { useMemo } from 'react';
import {
    Heading,
    Text,
    VStack,
    Box,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Grid,
    GridItem,
} from '@chakra-ui/react';

import type { RenderedSection } from '../tickets/types/formDynamicTypes';
import { FieldFactory } from '../tickets/fields/FieldFactory';

// On crée une interface locale qui hérite de RenderedSection et intègre la structure calculée


// 1. On retire proprement 'fields' ET 'section_id' du type d'origine pour éviter tout conflit
type BaseSectionWithoutIdOrFields = Omit<RenderedSection, 'fields' | 'section_id'>;

// 2. On crée notre interface locale étendue sans aucun risque de mauvaise surcharge
interface LocalExtendedSection extends BaseSectionWithoutIdOrFields {
    section_id: number | string;
    fields?: any[];
    visibleFields: any[];
}

interface RenderFormRendererProps {
    sections: any[];
    values: Record<number, unknown>;
    isEditing: boolean;
    onChange: (fieldId: number, value: unknown) => void;
}


interface RenderFormRendererProps {
    sections: any[]; // On accepte le tableau brut du parent pour l'assouplir
    values: Record<number, unknown>;
    isEditing: boolean;
    onChange: (fieldId: number, value: unknown) => void;
}

export const RenderFormRenderer: React.FC<RenderFormRendererProps> = ({
    sections,
    values,
    isEditing,
    onChange,
}) => {
    // Le reste du code reste strictement identique, mais TS sait maintenant 
    // exactement à quoi correspond "section.visibleFields" et accepte le type du parent !
    const computedSections = useMemo<LocalExtendedSection[]>(() => {
        if (!sections) return [];
        return sections
            .map(section => {
                const mappedFields = (section.fields || []).map((f: any) => {
                    let correctValue = f.value;
                    if (['image', 'file', 'signature'].includes(f.type || f.field_type) && f.file?.url) {
                        correctValue = f.file.url;
                    }

                    return {
                        ...f,
                        value: values[f.id] !== undefined ? values[f.id] : correctValue
                    };
                });

                return {
                    ...section,
                    visibleFields: mappedFields.filter(f => f.visible)

                };
            })
            .filter(section => section.visibleFields.length > 0);
    }, [sections, values]);

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
                            <Grid
                                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                                gap={6}
                                alignItems="start"
                            >
                                {section.visibleFields.map((field) => {
                                    const isFullWidthField = ['textarea', 'image', 'signature', 'file'].includes(field.type || field.field_type);

                                    return (
                                        <GridItem
                                            key={field.id}
                                            colSpan={{ base: 1, md: isFullWidthField ? 2 : 1 }}
                                            w="100%"
                                        >
                                            <FieldFactory
                                                field={field}
                                                isEditing={isEditing}
                                                onChange={onChange}
                                            />
                                        </GridItem>
                                    );
                                })}
                            </Grid>
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </VStack>
        </Accordion>
    );
};