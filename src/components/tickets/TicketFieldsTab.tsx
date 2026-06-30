import {
    Box, VStack, HStack, Button, useToast, Center, Text, Heading, Icon, Skeleton, Stack, Divider,
    Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FiEdit2, FiFileText, FiSave, FiLock } from 'react-icons/fi';
import { useRenderedTicketForm } from '../../hooks/useRenderedTicketForm';
import { RenderFormRenderer } from './RenderFormRenderer';
import type { Ticket } from '../../pages/TicketDetailPage';

// Ajout explicite du type attendu pour le ticket
interface TicketFieldsTabProps {
    ticket: Ticket | null;
    onRefresh: () => void;
}
export default function TicketFieldsTab({ ticket, onRefresh }: TicketFieldsTabProps) {
    const toast = useToast();
    const [isEditing, setIsEditing] = useState<boolean>(true);

    const interventionTypeId = typeof ticket?.intervention_type === 'object'
        ? ticket?.intervention_type?.id
        : ticket?.intervention_type;

    const { sections, values, isLoading, isSaving, error, hasSavedValues, updateFieldValue, saveAllValues, refresh } = useRenderedTicketForm(
        ticket?.id ? String(ticket.id) : null,
        interventionTypeId ? String(interventionTypeId) : null
    );

    // 🔒 Détermination du verrouillage du ticket
    const isClosed = ticket?.status === 'closed';

    // Initialisation du mode édition avec prise en compte du statut verrouillé
    useEffect(() => {
        if (isClosed) {
            setIsEditing(false);
        } else {
            setIsEditing(!hasSavedValues);
        }
    }, [hasSavedValues, isClosed]);

    const handleFieldChange = useCallback((fieldId: number, value: unknown) => {
        if (isClosed) return; // Sécurité supplémentaire
        updateFieldValue(fieldId, value);
    }, [updateFieldValue, isClosed]);

    const handleSubmit = async () => {
        if (isClosed) return;
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
                        <Icon as={isClosed ? FiLock : FiFileText} color={isClosed ? "gray.500" : "purple.600"} boxSize={5} />
                        <Heading size="xs" textTransform="uppercase" color="gray.700" letterSpacing="wider">
                            Rapport d'intervention {isClosed && "(Verrouillé)"}
                        </Heading>
                    </HStack>

                    {/* Le bouton Modifier s'affiche uniquement si le ticket n'est pas clos et qu'on n'édite pas déjà */}
                    {!isEditing && !isClosed && (
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

                {/* BANDEAU D'INFORMATION SUR LE VERROUILLAGE */}
                {isClosed && (
                    <Alert status="warning" variant="subtle" borderBottomWidth="1px" borderColor="orange.100">
                        <AlertIcon />
                        <Box>
                            <AlertTitle fontSize="sm" fontWeight="bold">Rapport d'intervention en lecture seule</AlertTitle>
                            <AlertDescription fontSize="xs">
                                Ce ticket a été clôturé. Les données de ce formulaire ont été gelées et ne peuvent plus être modifiées.
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}

                {/* FORMULAIRE (Le RenderFormRenderer reçoit isEditing={false} si isClosed est vrai, ce qui passe tous ses champs internes en readOnly/disabled) */}
                <Box p={6}>
                    <RenderFormRenderer
                        sections={sections}
                        values={values}
                        isEditing={isEditing}
                        onChange={handleFieldChange}
                    />
                </Box>

                {/* PIED DE PAGE D'ACTION (Masqué entièrement si le ticket est clos) */}
                {isEditing && !isClosed && (
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