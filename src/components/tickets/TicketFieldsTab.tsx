import {
    Box, VStack, HStack, Button, useToast, Center, Text, Heading, Icon, Skeleton, Stack, Divider
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FiEdit2, FiFileText, FiSave } from 'react-icons/fi';
import { useRenderedTicketForm } from '../../hooks/useRenderedTicketForm';
import { RenderFormRenderer } from './RenderFormRenderer';

// ... (Interface LocalTicketDetail inchangée)

export default function TicketFieldsTab({ ticket, onRefresh }: TicketFieldsTabProps) {
    const toast = useToast();
    const [isEditing, setIsEditing] = useState<boolean>(true);
    const isRefreshingRef = useRef<boolean>(false);

    const interventionTypeId = typeof ticket?.intervention_type === 'object'
        ? ticket?.intervention_type?.id
        : ticket?.intervention_type;

    const { sections, values, isLoading, isSaving, error, hasSavedValues, updateFieldValue, saveAllValues, refresh } = useRenderedTicketForm(
        ticket?.id ? String(ticket.id) : null,
        interventionTypeId ? String(interventionTypeId) : null
    );

    // Initialisation du mode édition
    useEffect(() => {
        setIsEditing(!hasSavedValues);
    }, [hasSavedValues]);

    const handleFieldChange = useCallback((fieldId: number, value: unknown) => {
        updateFieldValue(fieldId, value);
    }, [updateFieldValue]);

    const handleSubmit = async () => {
        const success = await saveAllValues();
        if (success) {
            toast({ title: 'Rapport enregistré', status: 'success', position: 'top' });
            setIsEditing(false);
            refresh();
            onRefresh();
        } else {
            toast({ title: 'Erreur', description: String(error), status: 'error', position: 'top' });
        }
    };

    if (isLoading) return (
        <Box p={4} maxW="4xl" mx="auto">
            <Stack spacing={4}>
                <Skeleton height="60px" borderRadius="xl" />
                <Skeleton height="300px" borderRadius="xl" />
            </Stack>
        </Box>
    );

    if (!ticket) return <Center py={10}><Text color="gray.500">Aucun ticket sélectionné.</Text></Center>;

    return (
        <Box maxW="4xl" mx="auto" pb={10}>
            <VStack spacing={0} align="stretch" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden" bg="white">

                {/* HEADER FIXE */}
                <HStack justify="space-between" p={5} bg="gray.50" borderBottom="1px" borderColor="gray.200">
                    <HStack spacing={3}>
                        <Icon as={FiFileText} color="purple.600" boxSize={5} />
                        <Heading size="xs" textTransform="uppercase" color="gray.700" letterSpacing="wider">
                            Rapport d'intervention
                        </Heading>
                    </HStack>

                    {!isEditing && (
                        <Button
                            leftIcon={<FiEdit2 />}
                            variant="ghost"
                            size="sm"
                            colorScheme="purple"
                            onClick={() => setIsEditing(true)}
                        >
                            Modifier
                        </Button>
                    )}
                </HStack>

                {/* FORMULAIRE */}
                <Box p={6}>
                    <RenderFormRenderer
                        sections={sections}
                        values={values}
                        isEditing={isEditing}
                        onChange={handleFieldChange}
                    />
                </Box>

                {/* PIED DE PAGE D'ACTION (Aligné avec le contenu du formulaire) */}
                {isEditing && (
                    <>
                        <Divider />
                        <HStack p={6} justify="flex-end" spacing={4} bg="gray.50">
                            {hasSavedValues && (
                                <Button variant="ghost" onClick={() => setIsEditing(false)} isDisabled={isSaving}>
                                    Annuler
                                </Button>
                            )}
                            <Button
                                colorScheme="purple"
                                onClick={handleSubmit}
                                isLoading={isSaving}
                                leftIcon={<FiSave />}
                            >
                                {hasSavedValues ? 'Mettre à jour' : 'Valider le rapport'}
                            </Button>
                        </HStack>
                    </>
                )}
            </VStack>
        </Box>
    );
}