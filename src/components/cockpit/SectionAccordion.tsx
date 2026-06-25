import { useRef, useState } from 'react';
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Flex,
    HStack,
    Text,
    Badge,
    Button,
    IconButton,
    useDisclosure,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    useToast,
} from '@chakra-ui/react';
import {
    FiPlus,
    FiTrash2,
    FiCloudLightning,
    FiCheckCircle,
    FiEdit2,
} from 'react-icons/fi';

import FieldDefinitionTable from './FieldDefinitionTable';

//  5. On importe désormais les types depuis le fichier centralisé
import type {
    BuilderSection,
    BuilderField
} from './fieldDefinition/constants';

interface SectionAccordionProps {
    sections: BuilderSection[];
    openSectionModal: (section: BuilderSection) => void;
    openFieldModal: (sectionId: string | number, field?: BuilderField) => void;
    handleUpdateFieldLocal: (
        sectionId: string | number,
        fieldId: string | number,
        key: keyof BuilderField,
        value: unknown
    ) => void;
    handleDeleteFieldLocal: (fieldId: string | number) => void;
    handleMoveFieldLocal: (
        sectionId: string | number,
        fieldId: string | number,
        direction: 'up' | 'down'
    ) => void;
    handleDeploySection: (sectionId: string | number) => Promise<void>;
    handleDeleteSection: (sectionId: string | number) => Promise<void>;
}

export default function SectionAccordion({
    sections,
    openSectionModal,
    openFieldModal,
    handleUpdateFieldLocal,
    handleDeleteFieldLocal,
    handleMoveFieldLocal,
    handleDeploySection,
    handleDeleteSection,
}: SectionAccordionProps) {
    const toast = useToast();
    const cancelRef = useRef<HTMLButtonElement>(null);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedSection, setSelectedSection] = useState<BuilderSection | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deployingId, setDeployingId] = useState<string | number | null>(null);

    // 👈 1. Typage plus générique et robuste pour les événements
    // ✅ NOUVEAU CODE (Propre et direct)
    const askDeleteSection = (e: any, section: any) => {
        e.stopPropagation(); // On empêche toujours l'accordéon de s'ouvrir/fermer
        handleDeleteSection(section.id); // On appelle directement la fonction du parent
    };

    const confirmDelete = async () => {
        if (!selectedSection) return;

        setIsDeleting(true);
        try {
            await handleDeleteSection(selectedSection.id);
            toast({ title: 'Section supprimée', status: 'success', duration: 3000 });
            setSelectedSection(null);
            onClose();
        } catch (error) {
            toast({ title: 'Erreur lors de la suppression', status: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const deploySection = async (e: React.MouseEvent, sectionId: string | number) => {
        e.stopPropagation();
        setDeployingId(sectionId);

        try {
            await handleDeploySection(sectionId);
            toast({ title: 'Section déployée', status: 'success', duration: 3000 });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { detail?: string } } };
            const message = err.response?.data?.detail || 'Erreur lors du déploiement';
            toast({ title: message, status: 'error' });
        } finally {
            setDeployingId(null);
        }
    };

    // ============================================================
    // EMPTY STATE
    // ============================================================
    if (!sections || sections.length === 0) {
        return (
            <Box
                p={8}
                textAlign="center"
                bg="white"
                borderRadius="lg"
                border="1px dashed"
                borderColor="gray.300"
            >
                <Text fontWeight="bold" color="gray.600">
                    Aucune section configurée
                </Text>
                <Text fontSize="sm" color="gray.500" mt={1}>
                    Cliquez sur "Nouvelle section" pour commencer.
                </Text>
            </Box>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <Box>
            <Accordion allowMultiple defaultIndex={[0]}>
                {sections.map((section) => {
                    const fieldsList = section.fields || section.field_definitions || [];
                    const isConditional = !!section.visibility_condition_group;

                    // 👈 3. Calcul du nombre de champs conditionnels
                    const conditionalFieldsCount = fieldsList.filter(
                        (field) =>
                            field.visibility_condition_group ||
                            field.required_condition_group ||
                            field.enabled_condition_group
                    ).length;

                    return (
                        <AccordionItem
                            key={`section-${section.id}`}
                            border="1px solid"
                            borderColor="gray.100"
                            borderRadius="lg"
                            mb={4}
                            overflow="hidden"
                            bg="white"
                            shadow="sm"
                        >
                            {/* HEADER */}
                            <Flex
                                align="center"
                                justify="space-between"
                                bg="gray.50"
                                px={4}
                                py={2}
                            >
                                <AccordionButton
                                    flex="1"
                                    _hover={{ bg: 'gray.100' }}
                                    _expanded={{ bg: 'purple.50', color: 'purple.800' }}
                                    p={2}
                                    borderRadius="md"
                                >
                                    <Flex justify="space-between" align="center" width="100%">
                                        <Box textAlign="left">
                                            <HStack spacing={3} wrap="wrap">
                                                <Text fontWeight="bold">{section.title}</Text>

                                                {section.code && (
                                                    <Text fontSize="xs" color="gray.400" fontFamily="mono">
                                                        [{section.code}]
                                                    </Text>
                                                )}

                                                <Badge colorScheme="purple" borderRadius="full">
                                                    {fieldsList.length} champ(s)
                                                </Badge>

                                                {isConditional && (
                                                    <Badge colorScheme="orange" borderRadius="full">
                                                        Section conditionnelle ({section.visibility_condition_group?.conditions?.length ?? 0} règle(s))
                                                    </Badge>
                                                )}

                                                {/* 👈 3. Affichage du badge des champs conditionnels */}
                                                {conditionalFieldsCount > 0 && (
                                                    <Badge colorScheme="yellow" borderRadius="full">
                                                        {conditionalFieldsCount} champ(s) conditionnel(s)
                                                    </Badge>
                                                )}
                                            </HStack>
                                        </Box>
                                    </Flex>

                                    <AccordionIcon />
                                </AccordionButton>

                                {/* ACTIONS */}
                                <HStack spacing={2} ml={3}>
                                    {section.is_deployed ? (
                                        <Badge
                                            colorScheme="green"
                                            display="flex"
                                            alignItems="center"
                                            px={2}
                                            py={1}
                                            borderRadius="md"
                                        >
                                            <FiCheckCircle style={{ marginRight: 4 }} />
                                            Déployée
                                        </Badge>
                                    ) : (
                                        <Badge
                                            colorScheme="gray"
                                            display="flex"
                                            alignItems="center"
                                            px={2}
                                            py={1}
                                            borderRadius="md"
                                        >
                                            Brouillon
                                        </Badge>
                                    )}

                                    {/* 👈 4. On empêche totalement la modification et la suppression si déployé */}
                                    {!section.is_deployed && (
                                        <>
                                            <IconButton
                                                aria-label="Modifier la section"
                                                icon={<FiEdit2 />}
                                                size="xs"
                                                colorScheme="blue"
                                                variant="ghost"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openSectionModal(section);
                                                }}
                                            />

                                            <Button
                                                size="xs"
                                                leftIcon={<FiCloudLightning />}
                                                colorScheme="purple"
                                                isLoading={deployingId === section.id}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => deploySection(e, section.id)}
                                            >
                                                Déployer
                                            </Button>

                                            <IconButton
                                                aria-label="Supprimer la section"
                                                icon={<FiTrash2 />}
                                                size="xs"
                                                colorScheme="red"
                                                variant="ghost"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => askDeleteSection(e, section)}
                                            />
                                        </>
                                    )}
                                </HStack>
                            </Flex>

                            {/* CONTENT */}
                            <AccordionPanel pb={4} pt={2}>
                                {/* TODO: 
                                    - afficher le détail des règles de visibilité de la section
                                */}
                                <Flex justify="flex-end" mb={3}>
                                    <Button
                                        size="xs"
                                        leftIcon={<FiPlus />}
                                        colorScheme="purple"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openFieldModal(section.id);
                                        }}
                                        isDisabled={section.is_deployed}
                                    >
                                        Ajouter un champ
                                    </Button>
                                </Flex>

                                <FieldDefinitionTable
                                    fields={fieldsList}
                                    // 👈 2. Sécurisation explicite du booléen
                                    isSectionDeployed={!!section.is_deployed}
                                    onUpdateField={(fieldId, key, value) =>
                                        handleUpdateFieldLocal(section.id, fieldId, key, value)
                                    }
                                    onDeleteField={handleDeleteFieldLocal}
                                    onMoveField={(fieldId, direction) =>
                                        handleMoveFieldLocal(section.id, fieldId, direction)
                                    }
                                    onEditField={(field) => openFieldModal(section.id, field)}
                                />
                            </AccordionPanel>
                        </AccordionItem>
                    );
                })}
            </Accordion>

            {/* DIALOG DELETE */}
            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Supprimer la section "{selectedSection?.title}" ?
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Cette action est irréversible et supprimera tous les champs associés à cette section.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Annuler
                            </Button>

                            <Button
                                colorScheme="red"
                                ml={3}
                                onClick={confirmDelete}
                                isLoading={isDeleting}
                            >
                                Supprimer
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}