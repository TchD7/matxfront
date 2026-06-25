import {
    Box,
    VStack,
    HStack,
    Button,
    useToast,
    Center,
    Text,
    Heading,
    Icon,
    Skeleton,
    Stack,
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FiEdit2, FiFileText } from 'react-icons/fi';
import { useRenderedTicketForm } from '../../hooks/useRenderedTicketForm';
import { RenderFormRenderer } from './RenderFormRenderer';

// Définition de l'interface alignée sur types/ticket.ts pour contourner les conflits Vite
interface LocalTicketDetail {
    id: number;
    status: 'draft' | 'planned' | 'in_progress' | 'paused' | 'completed' | 'closed';
    started_at: string | null;
    ended_at: string | null;
    planned_at: string | null;
    is_late: boolean;
    intervention_type?: string | { id: string } | null;
}

interface TicketFieldsTabProps {
    ticket: LocalTicketDetail;
    onRefresh: () => void;
}

export default function TicketFieldsTab({ ticket, onRefresh }: TicketFieldsTabProps) {
    const toast = useToast();
    const [isEditingGlobal, setIsEditingGlobal] = useState<boolean>(true);
    const isRefreshingRef = useRef<boolean>(false);

    // Extraction sécurisée de l'ID du type d'intervention
    const interventionTypeId = typeof ticket?.intervention_type === 'object'
        ? ticket?.intervention_type?.id
        : ticket?.intervention_type;

    // Récupération des données du formulaire dynamique
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
    } = useRenderedTicketForm(
        ticket?.id ? String(ticket.id) : null,
        interventionTypeId ? String(interventionTypeId) : null
    );

    // Gestion des erreurs de rendu renvoyées par le hook
    useEffect(() => {
        if (error) {
            toast({
                title: 'Erreur de rendu',
                description: String(error),
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        }
    }, [error, toast]);

    // Bascule automatique du mode édition selon l'existence de valeurs sauvegardées
    useEffect(() => {
        if (hasSavedValues) {
            setIsEditingGlobal(false);
        } else if (ticket?.id) {
            setIsEditingGlobal(true);
        }
    }, [hasSavedValues, ticket?.id]);

    // useCallback pour geler la référence de la fonction et bloquer les rerenders de champs
    const handleFieldChange = useCallback((fieldId: number, value: unknown) => {
        updateFieldValue(fieldId, value);
    }, [updateFieldValue]);

    // Soumission et enregistrement du formulaire complet
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
            onRefresh();
        } else {
            toast({
                title: 'Erreur lors de la sauvegarde',
                description: String(error) || 'Impossible de sauvegarder les valeurs.',
                status: 'error',
                duration: 4000,
                isClosable: true,
                position: 'top',
            });
        }
    };

    // Rendu des squelettes d'attente fluides pendant le chargement initial
    if (isLoading) {
        return (
            <Box p={4} maxW="4xl" mx="auto">
                <Stack spacing={4}>
                    <Skeleton height="54px" borderRadius="xl" />
                    <Skeleton height="180px" borderRadius="xl" />
                    <Skeleton height="240px" borderRadius="xl" />
                </Stack>
            </Box>
        );
    }

    if (!ticket) {
        return (
            <Center py={10}>
                <Text color="gray.500">Aucun ticket sélectionné.</Text>
            </Center>
        );
    }

    const showReadOnlyView = !isEditingGlobal && (hasSavedValues || isRefreshingRef.current);

    return (
        <Box p={4} maxW="4xl" mx="auto">
            <VStack spacing={6} align="stretch">

                {/* BANDEAU SUPÉRIEUR ET CONTRÔLE DE L'ÉTAT DE LECTURE */}
                <HStack
                    justify="space-between"
                    bg="gray.50"
                    p={4}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                >
                    <HStack spacing={3}>
                        <Icon as={FiFileText} color="purple.600" boxSize={5} />
                        <Heading size="xs" textTransform="uppercase" color="gray.700" letterSpacing="wider">
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

                {/* COMPOSANT CENTRAL DE RENDU DU FORMULAIRE */}
                <RenderFormRenderer
                    sections={sections}
                    values={values}
                    isEditing={isEditingGlobal}
                    onChange={handleFieldChange}
                />

                {/* ACTIONS DE PIED DE PAGE DU FORMULAIRE */}
                {isEditingGlobal && (
                    <HStack spacing={4} justify="flex-end" pt={2}>
                        {hasSavedValues && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditingGlobal(false)}
                                isDisabled={isSaving}
                                size="md"
                            >
                                Annuler
                            </Button>
                        )}
                        <Button
                            colorScheme="purple"
                            onClick={handleSubmit}
                            isLoading={isSaving}
                            size="md"
                            px={6}
                            shadow="sm"
                        >
                            {hasSavedValues ? 'Mettre à jour le rapport' : 'Valider et fermer le rapport'}
                        </Button>
                    </HStack>
                )}
            </VStack>
        </Box>
    );
}