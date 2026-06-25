import React, { useMemo } from 'react';
import { SimpleGrid, Card, CardHeader, CardBody, Heading, Text, VStack, Box } from '@chakra-ui/react';
import { RenderedSection } from '../types/formDynamicTypes';
import { FieldFactory } from './FieldFactory';

interface RenderFormRendererProps {
    sections: RenderedSection[];
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

    // Reconstruction efficace des sections contenant au moins un composant visible
    const visibleSections = useMemo(() => {
        return sections
            .map((section) => ({
                ...section,
                visibleFields: section.fields.filter((f) => f.visible),
            }))
            .filter((section) => section.visibleFields.length > 0);
    }, [sections]);

    if (visibleSections.length === 0) {
        return (
            <Box textAlign="center" py={10} borderWidth="1px" borderStyle="dashed" borderRadius="lg" bg="gray.50">
                <Text color="gray.500" fontSize="sm">Aucun champ visible dans le rapport actuel.</Text>
            </Box>
        );
    }

    return (
        <VStack spacing={6} align="stretch" w="100%">
            {visibleSections.map((section) => (
                <Card
                    key={section.section_id}
                    variant="outline"
                    boxShadow="sm"
                    borderRadius="xl"
                    borderColor="gray.200"
                    bg="white"
                >
                    <CardHeader bg="gray.50" borderBottom="1px" borderColor="gray.100" py={4} borderTopRadius="xl">
                        <Heading size="sm" color="gray.800" fontWeight="semibold">
                            {section.section_title}
                        </Heading>
                        {section.section_description && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                {section.section_description}
                            </Text>
                        )}
                    </CardHeader>
                    <CardBody py={6}>
                        {/* Grille responsive : 1 colonne sur mobile, 2 sur écrans plus larges */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={6} spacingY={5}>
                            {section.visibleFields.map((field) => {
                                // On injecte la valeur actuelle issue de l'état local du hook
                                const fieldWithValue = { ...field, value: values[field.id] ?? field.value };
                                return (
                                    <FieldFactory
                                        key={field.id}
                                        field={fieldWithValue}
                                        isEditing={isEditing}
                                        onChange={onChange}
                                    />
                                );
                            })}
                        </SimpleGrid>
                    </CardBody>
                </Card>
            ))}
        </VStack>
    );
};