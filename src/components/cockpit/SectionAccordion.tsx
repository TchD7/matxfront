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

// 📝 Ajout de FiEdit2 dans les imports
import { FiPlus, FiTrash2, FiCloudLightning, FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import { useRef, useState } from 'react';
import FieldDefinitionTable from './FieldDefinitionTable';

interface SectionAccordionProps {
    sections: any[];
    openSectionModal: (section: any) => void; // 👈 1. On déclare la fonction pour ouvrir le modal de la section
    openFieldModal: (sectionId: any, field?: any) => void;
    handleUpdateFieldLocal: (sectionId: any, fieldId: any, key: string, value: any) => void;
    handleDeleteFieldLocal: (fieldId: any) => void;
    handleMoveFieldLocal: (sectionId: any, index: number, direction: 'up' | 'down') => void;
    handleDeploySection: (sectionId: any) => Promise<void>;
    handleDeleteSection: (sectionId: any) => Promise<void>;
}

export default function SectionAccordion({
    sections,
    openSectionModal, // 👈 2. On la récupère ici
    openFieldModal,
    handleUpdateFieldLocal,
    handleDeleteFieldLocal,
    handleMoveFieldLocal,
    handleDeploySection,
    handleDeleteSection,
}: SectionAccordionProps) {
    const toast = useToast();
    const cancelRef = useRef<any>(null);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedSection, setSelectedSection] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deployingId, setDeployingId] = useState<any>(null);

    const askDeleteSection = (e: React.MouseEvent, section: any) => {
        e.stopPropagation();
        setSelectedSection(section);
        onOpen();
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

    const deploySection = async (e: React.MouseEvent, sectionId: any) => {
        e.stopPropagation();
        setDeployingId(sectionId);

        try {
            await handleDeploySection(sectionId);
            toast({ title: 'Section déployée', status: 'success', duration: 3000 });
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors du déploiement';
            toast({ title: message, status: 'error' });
        } finally {
            setDeployingId(null);
        }
    };

    return (
        <Box>
            <Accordion allowMultiple defaultIndex={[0]}>
                {sections.map((section) => (
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
                            {/* Zone clickable accordion */}
                            <AccordionButton
                                flex="1"
                                _hover={{ bg: 'gray.100' }}
                                _expanded={{ bg: 'purple.50', color: 'purple.800' }}
                                p={2}
                            >
                                <Flex justify="space-between" align="center" width="100%">
                                    <HStack spacing={3}>
                                        <Text fontWeight="bold">{section.title}</Text>

                                        {section.code && (
                                            <Text fontSize="xs" color="gray.400" fontFamily="mono">
                                                [{section.code}]
                                            </Text>
                                        )}

                                        <Badge colorScheme="purple" borderRadius="full">
                                            {section.fields?.length || 0} champ(s)
                                        </Badge>
                                    </HStack>
                                </Flex>

                                <AccordionIcon />
                            </AccordionButton>

                            {/* ACTIONS (IMPORTANT: hors AccordionButton) */}
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
                                        Déployé
                                    </Badge>
                                ) : (
                                    <>
                                        {/* ✏️ BOUTON MODIFIER : Lié au openSectionModal reçu en prop */}
                                        <IconButton
                                            aria-label="Modifier la section"
                                            icon={<FiEdit2 />}
                                            size="xs"
                                            colorScheme="blue"
                                            variant="ghost"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openSectionModal(section); // 👈 3. Ouvre le modal avec la section à éditer
                                            }}
                                        />

                                        {/* 🚀 BOUTON DÉPLOYER */}
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
                                    </>
                                )}

                                {/* 🗑️ BOUTON SUPPRIMER */}
                                <IconButton
                                    aria-label="Supprimer la section"
                                    icon={<FiTrash2 />}
                                    size="xs"
                                    colorScheme="red"
                                    variant="ghost"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => askDeleteSection(e, section)}
                                />
                            </HStack>
                        </Flex>

                        {/* CONTENT */}
                        <AccordionPanel pb={4} pt={2}>
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
                                >
                                    Ajouter un champ
                                </Button>
                            </Flex>

                            <FieldDefinitionTable
                                // ✅ On vérifie si l'API envoie "fields" ou "field_definitions"
                                fields={section.fields || section.field_definitions || []}
                                sectionId={section.id}
                                onUpdateField={(fieldId, key, value) =>
                                    handleUpdateFieldLocal(section.id, fieldId, key, value)
                                }
                                onDeleteField={handleDeleteFieldLocal}
                                onMoveField={handleMoveFieldLocal}
                                onEditField={(field) => openFieldModal(section.id, field)}
                            />
                        </AccordionPanel>
                    </AccordionItem>
                ))}
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
                            Cette action est irréversible.
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