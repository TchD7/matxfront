import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    FormControl,
    FormLabel,
    HStack,
    StackDivider,
    Text,
    VStack,
} from '@chakra-ui/react';
import type { RenderSection } from '../../types/formRender.types';
import { RenderFieldInput } from './RenderFieldInput';

interface RenderFormRendererProps {
    sections: RenderSection[];
    values: Record<string, any>;
    isEditing: boolean;
    onChange: (fieldId: string | number, value: any) => void;
}

export function RenderFormRenderer({ sections, values, isEditing, onChange }: RenderFormRendererProps) {
    return (
        <Accordion allowMultiple defaultIndex={sections.map((_, index) => index)}>
            {sections.map((section) => (
                <AccordionItem
                    key={section.section_id}
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="xl"
                    mb={5}
                    overflow="hidden"
                    shadow="sm"
                    bg="gray.50"
                >
                    <AccordionButton _expanded={{ bg: 'white', borderBottom: '1px solid', borderColor: 'gray.100' }} p={4}>
                        <Box as="span" flex="1" textAlign="left" fontWeight="bold" fontSize="md" color="gray.700">
                            {section.section_title}
                        </Box>
                        <AccordionIcon color="purple.500" />
                    </AccordionButton>
                    <AccordionPanel pb={5} pt={4} bg="white">
                        <VStack spacing={4} align="stretch" divider={<StackDivider borderColor="gray.100" />}>
                            {section.fields?.map((field) => {
                                const isCheckbox = field.type === 'checkbox';
                                return (
                                    <Box key={field.id} py={2}>
                                        {isEditing ? (
                                            <FormControl isRequired={field.required}>
                                                {!isCheckbox && (
                                                    <FormLabel
                                                        fontSize="xs"
                                                        fontWeight="bold"
                                                        color="gray.500"
                                                        textTransform="uppercase"
                                                        letterSpacing="wider"
                                                        mb={1}
                                                    >
                                                        {field.label}
                                                    </FormLabel>
                                                )}
                                                <RenderFieldInput field={field} value={values[String(field.id)]} onChange={onChange} />
                                            </FormControl>
                                        ) : (
                                            <VStack align="stretch" spacing={1}>
                                                <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase">
                                                    {field.label} {field.required && <Text as="span" color="red.500">*</Text>}
                                                </Text>
                                                <Box pl={1}>
                                                    <Text color="gray.800" fontWeight="medium" fontSize="sm">
                                                        {String(values[String(field.id)] ?? '')}
                                                    </Text>
                                                </Box>
                                            </VStack>
                                        )}
                                    </Box>
                                );
                            })}
                        </VStack>
                    </AccordionPanel>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
