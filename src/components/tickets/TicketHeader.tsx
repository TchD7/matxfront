import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Badge,
    Button,
    Divider,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
} from '@chakra-ui/react';

// ================= TYPES =================
interface Ticket {
    id: string;
    number?: string;
    status: string;
    is_breakdown?: boolean;
    planned_at?: string;
    started_at?: string;
    ended_at?: string;

    equipment?: {
        name?: string;
        code?: string;
        criticality?: string;
    };

    intervention_type?: {
        name?: string;
    };
}

// ================= STATUS STYLE =================
const getStatus = (status: string) => {
    switch (status) {
        case 'draft':
            return { label: 'Brouillon', color: 'gray' };
        case 'planned':
            return { label: 'Planifié', color: 'purple' };
        case 'in_progress':
            return { label: 'En cours', color: 'blue' };
        case 'completed':
            return { label: 'Terminé', color: 'green' };
        case 'closed':
            return { label: 'Clôturé', color: 'orange' };
        default:
            return { label: status, color: 'gray' };
    }
};

// ================= COMPONENT =================
export default function TicketHeader({
    ticket,
    onBack,
    onAction,
}: {
    ticket: Ticket;
    onBack?: () => void;
    // Mise à jour de la signature pour passer le mode au parent s'il s'agit d'une duplication
    onAction?: (action: string, payload?: { mode: 'linked' | 'independent' }) => void;
}) {
    const status = getStatus(ticket.status);

    // Hook Chakra UI pour contrôler l'ouverture de la modal
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleDuplicateSubmit = (mode: 'linked' | 'independent') => {
        if (onAction) {
            onAction('duplicate', { mode });
        }
        onClose(); // Ferme la modal après sélection
    };

    return (
        <Box
            bg="white"
            borderBottom="1px solid"
            borderColor="gray.100"
            p={4}
        >
            <Flex justify="space-between" align="center">

                {/* LEFT INFO */}
                <VStack align="start" spacing={1}>
                    <VStack align="flex-start" spacing={1}>
                        <HStack>
                            <Text fontSize="lg" fontWeight="bold">
                                Ticket {ticket.number || 'N° inconnu'}
                            </Text>

                            <Badge colorScheme={status.color}>
                                {status.label}
                            </Badge>

                            {ticket.is_breakdown && (
                                <Badge colorScheme="red">
                                    Panne
                                </Badge>
                            )}
                        </HStack>

                        <Text fontSize="sm" color="gray.500">
                            {ticket.equipment?.name} ({ticket.equipment?.code})
                        </Text>

                        <HStack spacing={2}>
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">
                                Type d'intervention:
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                                {ticket.intervention_type?.name || 'Non défini'}
                            </Text>
                        </HStack>
                    </VStack>
                </VStack>

                {/* RIGHT ACTIONS */}
                <HStack spacing={3}>

                    {onBack && (
                        <Button size="sm" variant="ghost" onClick={onBack}>
                            Retour
                        </Button>
                    )}

                    {/* DUPLICATE BUTTON - Ouvre désormais la modal au clic */}
                    {ticket.status !== 'draft' && onAction && (
                        <Button
                            size="sm"
                            variant="outline"
                            colorScheme="gray"
                            onClick={onOpen}
                        >
                            Dupliquer
                        </Button>
                    )}

                    {/* DELETE BUTTON - Always visible */}
                    {onAction && (
                        <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => onAction('delete')}
                        >
                            Supprimer
                        </Button>
                    )}

                    {ticket.status === 'planned' && onAction && (
                        <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => onAction('start')}
                        >
                            Démarrer
                        </Button>
                    )}

                    {ticket.status === 'in_progress' && onAction && (
                        <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => onAction('complete')}
                        >
                            Terminer
                        </Button>
                    )}

                    {ticket.status === 'completed' && onAction && (
                        <Button
                            size="sm"
                            colorScheme="orange"
                            onClick={() => onAction('close')}
                        >
                            Clôturer
                        </Button>
                    )}

                </HStack>
            </Flex>

            <Divider mt={3} />

            {/* ================= MODAL DE CHOIX DE DUPLICATION ================= */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent p={2}>
                    <ModalHeader fontSize="md" fontWeight="bold">
                        Options de duplication
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text fontSize="sm" color="gray.600">
                                Choisissez la manière dont vous souhaitez dupliquer le ticket <strong>{ticket.number}</strong> :
                            </Text>

                            {/* Option 1: Duplication Liée */}
                            <Box
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3}
                                cursor="pointer"
                                _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                                onClick={() => handleDuplicateSubmit('linked')}
                            >
                                <Text fontWeight="semibold" fontSize="sm" color="blue.700">
                                    Duplication Liée (Enfant)
                                </Text>
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    Génère une sous-tâche liée à ce ticket (ex: {ticket.number}_1).
                                </Text>
                            </Box>

                            {/* Option 2: Duplication Indépendante */}
                            <Box
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3}
                                cursor="pointer"
                                _hover={{ borderColor: 'purple.400', bg: 'purple.50' }}
                                onClick={() => handleDuplicateSubmit('independent')}
                            >
                                <Text fontWeight="semibold" fontSize="sm" color="purple.700">
                                    Duplication Indépendante (Nouveau ticket)
                                </Text>
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    Crée un tout nouveau ticket autonome avec son propre numéro incrémenté. Aucune relation parent-enfant.
                                </Text>
                            </Box>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button size="sm" variant="ghost" onClick={onClose}>
                            Annuler
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}