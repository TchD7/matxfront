import {
    Box,
    VStack,
    HStack,
    Button,
    useToast,
    Spinner,
    Center,
    Text,
    Divider,
    Heading,
    Icon,
} from '@chakra-ui/react';

import { useState, useEffect, useRef } from 'react';
import { FiEdit2, FiFileText } from 'react-icons/fi';
import { useRenderedTicketForm } from '../../hooks/useRenderedTicketForm';
import { RenderFormRenderer } from './RenderFormRenderer';

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
    const [isEditingGlobal, setIsEditingGlobal] = useState(true);
    const isRefreshingRef = useRef(false);

    const interventionTypeId = typeof ticket?.intervention_type === 'object'
        ? ticket?.intervention_type?.id
        : ticket?.intervention_type;

    const {
        sections,
        values,
        isLoading,
        isSaving,
        error,
        hasSavedValues,
        updateFieldValue,
        saveAllValues,
        refresh,
    } = useRenderedTicketForm(ticket?.id ?? null, interventionTypeId ?? null);

    useEffect(() => {
        if (error) {
            toast({
                title: 'Erreur de rendu',
                description: error,
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        }
    }, [error, toast]);

    useEffect(() => {
        if (hasSavedValues) {
            setIsEditingGlobal(false);
        } else if (ticket?.id) {
            setIsEditingGlobal(true);
        }
    }, [hasSavedValues, ticket?.id]);

    const handleFieldChange = (fieldId: string | number, value: any) => {
        updateFieldValue(fieldId, value);
    };

    const handleSubmit = async () => {
        const success = await saveAllValues();

        if (success) {
            toast({
                title: 'Rapport enregistré avec succès',
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top',
            });
            isRefreshingRef.current = true;
            setIsEditingGlobal(false);
            refresh();
        } else {
            toast({
                title: 'Erreur lors de la sauvegarde',
                description: error || 'Impossible de sauvegarder les valeurs.',
                status: 'error',
                duration: 4000,
                isClosable: true,
                position: 'top',
            });
        }
    };

    if (!ticket) return <Center py={10}><Spinner color="purple.500" /></Center>;
    if (isLoading) return <Center py={10} flexDir="column" gap={3}><Spinner color="purple.500" size="xl" /><Text color="gray.500" fontSize="sm">Chargement du rapport technique...</Text></Center>;
    if (sections.length === 0) return <Center py={10}><Text>Aucune section configurée pour ce type d'intervention.</Text></Center>;

    const showReadOnlyView = !isEditingGlobal && (hasSavedValues || isRefreshingRef.current);

    return (
        <Box p={4} maxW="4xl" mx="auto">
            <VStack spacing={6} align="stretch">

                {/* BANDEAU SUPÉRIEUR ET BOUTON DE MODIFICATION GLOBAL */}
                <HStack justify="space-between" bg="gray.50" p={3} borderRadius="lg" borderWidth="1px">
                    <HStack spacing={2}>
                        <Icon as={FiFileText} color="purple.600" boxSize={5} />
                        <Heading size="xs" textTransform="uppercase" color="gray.600" letterSpacing="wider">
                            Rapport Technique d'Intervention
                        </Heading>
                    </HStack>

                    {showReadOnlyView && (
                        <Button
                            leftIcon={<FiEdit2 />}
                            colorScheme="purple"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                isRefreshingRef.current = false;
                                setIsEditingGlobal(true);
                            }}
                        >
                            Modifier le rapport
                        </Button>
                    )}
                </HStack>

                <Divider />

                <RenderFormRenderer
                    sections={sections}
                    values={values}
                    isEditing={isEditingGlobal}
                    onChange={handleFieldChange}
                />

                {isEditingGlobal && (
                    <HStack spacing={4} justify="flex-end">
                        {hasSavedValues && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditingGlobal(false)}
                                isDisabled={isSaving}
                                size="lg"
                            >
                                Annuler
                            </Button>
                        )}
                        <Button
                            colorScheme="purple"
                            onClick={handleSubmit}
                            isLoading={isSaving}
                            size="lg"
                            px={8}
                            shadow="md"
                        >
                            {hasSavedValues ? 'Mettre à jour le rapport' : 'Valider et fermer le rapport'}
                        </Button>
                    </HStack>
                )}
            </VStack>
        </Box>
    );
}