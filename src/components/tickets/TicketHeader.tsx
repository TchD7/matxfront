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
    RadioGroup,
    Radio,
} from '@chakra-ui/react';

import { useMemo, useState } from 'react';


// ================= TYPES =================

type TicketStatus =
    | 'draft'
    | 'planned'
    | 'in_progress'
    | 'completed'
    | 'closed';

type TicketAction =
    | 'start'
    | 'complete'
    | 'close'
    | 'delete'
    | 'duplicate'
    | 'unassign';

interface Ticket {
    id: string | number;
    number?: string;
    status: TicketStatus;
    technician_name?: string | null; // Added to handle assignment logic

    is_breakdown?: boolean;

    equipment?: {
        name?: string;
        code?: string;
    };

    intervention_type?: {
        id?: string | number;
        name?: string;
    };
}

type ActionPayload =
    | {
        mode?: 'linked' | 'independent';
        intervention_type_id?: string | number | null;
    }
    | {
        result?: string;
        reason?: string | null;
        comment?: string;
    }
    | undefined;

interface Props {
    ticket: Ticket;
    onBack?: () => void;
    onAction?: (action: TicketAction, payload?: ActionPayload) => void;
}


// ================= STATE MACHINE =================

const WORKFLOW: Record<TicketStatus, Partial<Record<TicketAction, boolean>>> = {
    draft: {
        delete: true,
        duplicate: true,
    },
    planned: {
        start: true,
        unassign: true, // L'action est autorisée par le workflow à cet état
        delete: true,
        duplicate: true,
    },
    in_progress: {
        complete: true,
        delete: true,
        duplicate: true,
    },
    completed: {
        close: true,
        duplicate: true,
    },
    closed: {
        duplicate: true,
    },
};

const can = (status: TicketStatus, action: TicketAction) =>
    !!WORKFLOW[status]?.[action];


// ================= STATUS =================

const getStatus = (status: TicketStatus) => {
    switch (status) {
        case 'draft': return { label: 'Brouillon', color: 'gray' };
        case 'planned': return { label: 'Planifié', color: 'purple' };
        case 'in_progress': return { label: 'En cours', color: 'blue' };
        case 'completed': return { label: 'Terminé', color: 'green' };
        case 'closed': return { label: 'Clôturé', color: 'orange' };
    }
};


// ================= COMPONENT =================

export default function TicketHeader({
    ticket,
    onBack,
    onAction,
}: Props) {

    const status = getStatus(ticket.status);

    // ===== MODALS =====
    const duplicateModal = useDisclosure();
    const confirmModal = useDisclosure();

    const [duplicateMode, setDuplicateMode] =
        useState<'linked' | 'independent'>('linked');

    const [pending, setPending] =
        useState<{ action: TicketAction; payload?: any } | null>(null);


    // ================= ACTIONS =================

    const requestAction = (action: TicketAction, payload?: any) => {
        setPending({ action, payload });
        confirmModal.onOpen();
    };

    const confirmAction = () => {
        if (!onAction || !pending) return;

        onAction(pending.action, pending.payload);

        setPending(null);
        confirmModal.onClose();
    };


    // SPECIAL ACTIONS

    const handleStart = () =>
        requestAction('start');

    const handleComplete = () =>
        requestAction('complete', {
            result: 'ok',
            comment: 'Terminé depuis header',
        });

    const handleClose = () =>
        requestAction('close');

    const handleDelete = () =>
        requestAction('delete');

    const handleUnassign = () =>
        requestAction('unassign');

    const handleDuplicate = () =>
        duplicateModal.onOpen();

    const confirmDuplicate = () => {
        if (!onAction) return;

        onAction('duplicate', {
            mode: duplicateMode,
            intervention_type_id:
                ticket.intervention_type?.id || null,
        });

        duplicateModal.onClose();
    };


    // ================= UI ACTIONS (STATE MACHINE) =================

    const actions = useMemo(() => {

        const s = ticket.status;

        // Condition stricte : Doit être autorisé par le workflow ET avoir un technicien d'assigné
        const showUnassign = can(s, 'unassign') && !!ticket.technician_name;

        return [
            {
                key: 'start' as TicketAction,
                label: 'Démarrer',
                color: 'blue',
                show: can(s, 'start'),
                onClick: handleStart,
            },
            {
                key: 'complete' as TicketAction,
                label: 'Terminer',
                color: 'green',
                show: can(s, 'complete'),
                onClick: handleComplete,
            },
            {
                key: 'close' as TicketAction,
                label: 'Clôturer',
                color: 'orange',
                show: can(s, 'close'),
                onClick: handleClose,
            },
            {
                key: 'unassign' as TicketAction,
                label: 'Désassigner',
                color: 'red',
                variant: 'outline', // Optionnel : pour le différencier visuellement
                show: showUnassign,
                onClick: handleUnassign,
            },
        ].filter(a => a.show);

    }, [ticket.status, ticket.technician_name]);


    // ================= RENDER =================

    return (
        <Box bg="white" borderBottom="1px solid" borderColor="gray.100" p={4}>

            <Flex justify="space-between" align="center">

                {/* LEFT */}
                <VStack align="start" spacing={1}>

                    <HStack>
                        <Text fontSize="lg" fontWeight="bold">
                            Ticket {ticket.number || ticket.id}
                        </Text>

                        <Badge colorScheme={status?.color}>
                            {status?.label}
                        </Badge>

                        {ticket.is_breakdown && (
                            <Badge colorScheme="red">Panne</Badge>
                        )}
                    </HStack>

                    <Text fontSize="sm" color="gray.500">
                        {ticket.equipment?.name || 'Équipement'} ({ticket.equipment?.code || 'N/A'})
                    </Text>

                    <Text fontSize="sm">
                        {ticket.intervention_type?.name || 'Type non défini'}
                    </Text>

                </VStack>


                {/* RIGHT ACTIONS */}
                <HStack spacing={3} flexWrap="wrap">

                    {onBack && (
                        <Button size="sm" variant="ghost" onClick={onBack}>
                            Retour
                        </Button>
                    )}

                    {/* STATIC ACTIONS */}
                    {can(ticket.status, 'duplicate') && (
                        <Button
                            size="sm"
                            colorScheme="purple"
                            variant="outline"
                            onClick={handleDuplicate}
                        >
                            Dupliquer
                        </Button>
                    )}

                    {can(ticket.status, 'delete') && (
                        <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={handleDelete}
                        >
                            Supprimer
                        </Button>
                    )}

                    {/* STATE MACHINE ACTIONS */}
                    {actions.map(a => (
                        <Button
                            key={a.key}
                            size="sm"
                            colorScheme={a.color}
                            variant={a.key === 'unassign' ? 'outline' : 'solid'}
                            onClick={a.onClick}
                        >
                            {a.label}
                        </Button>
                    ))}

                </HStack>

            </Flex>

            <Divider mt={3} />


            {/* ================= DUPLICATION MODAL ================= */}
            <Modal isOpen={duplicateModal.isOpen} onClose={duplicateModal.onClose} isCentered>

                <ModalOverlay />

                <ModalContent>

                    <ModalHeader>Dupliquer le ticket</ModalHeader>

                    <ModalCloseButton />

                    <ModalBody>

                        <RadioGroup
                            value={duplicateMode}
                            onChange={(v) => setDuplicateMode(v as any)}
                        >

                            <VStack spacing={3}>

                                <Box borderWidth="1px" p={3} borderRadius="md">
                                    <Radio value="linked">Ticket lié</Radio>
                                </Box>

                                <Box borderWidth="1px" p={3} borderRadius="md">
                                    <Radio value="independent">Indépendant</Radio>
                                </Box>

                            </VStack>

                        </RadioGroup>

                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" onClick={duplicateModal.onClose}>
                            Annuler
                        </Button>

                        <Button colorScheme="purple" onClick={confirmDuplicate}>
                            Confirmer
                        </Button>
                    </ModalFooter>

                </ModalContent>

            </Modal>


            {/* ================= CONFIRMATION MODAL ================= */}
            <Modal isOpen={confirmModal.isOpen} onClose={confirmModal.onClose} isCentered>

                <ModalOverlay />

                <ModalContent>

                    <ModalHeader>Confirmation</ModalHeader>

                    <ModalBody>
                        <Text>
                            Confirmer l'action : <b>{pending?.action === 'unassign' ? 'Désassigner' : pending?.action}</b> ?
                        </Text>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" onClick={confirmModal.onClose}>
                            Annuler
                        </Button>

                        <Button colorScheme="red" onClick={confirmAction}>
                            Confirmer
                        </Button>
                    </ModalFooter>

                </ModalContent>

            </Modal>

        </Box>
    );
}