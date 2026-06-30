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
    Image,
} from '@chakra-ui/react';

import { useMemo, useState } from 'react';
import api from '../../api/apiClient';

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
    technician_name?: string | null;
    is_breakdown?: boolean;
    equipment?: {
        name?: string;
        code?: string;
    };
    intervention_type?: {
        id?: string | number;
        name?: string;
    };
    permissions?: {
        can_close?: boolean;
        can_duplicate?: boolean;
        [key: string]: any;
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
    loading?: boolean;
    onBack?: () => void;
    onAction?: (action: TicketAction, payload?: ActionPayload) => void;
    onDownloadPdf?: () => void;
    isDownloadingPdf?: boolean;
}

// ================= STATE MACHINE =================

const WORKFLOW: Record<TicketStatus, Partial<Record<TicketAction, boolean>>> = {
    draft: {
        delete: true,
        duplicate: true,
    },
    planned: {
        start: true,
        unassign: true,
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
        delete: true,
    },
    closed: {
        duplicate: true,
        delete: true,
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
    loading,
    onBack,
    onAction,
    onDownloadPdf,
    isDownloadingPdf,
}: Props) {

    const status = getStatus(ticket.status);

    // ===== MODALS =====
    const duplicateModal = useDisclosure();
    const confirmModal = useDisclosure();
    const qrModal = useDisclosure();

    // ===== STATES =====
    const [duplicateMode, setDuplicateMode] =
        useState<'linked' | 'independent'>('linked');

    const [pending, setPending] =
        useState<{ action: TicketAction; payload?: any } | null>(null);

    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

    // ================= ACTIONS =================

    const requestAction = (action: TicketAction, payload?: any) => {
        setPending({ action, payload });
        confirmModal.onOpen();
    };

    const confirmAction = () => {
        if (!onAction || !pending) return;

        // 1. On stocke l'action locale pour savoir ce qui vient d'être lancé
        const currentAction = pending.action;

        // 2. On exécute l'action (l'appel API se fait dans le composant parent)
        onAction(pending.action, pending.payload);

        // 3. On nettoie les états du modal
        setPending(null);
        confirmModal.onClose();


        // pour éviter que le composant ne tente de recharger le ticket fantôme
        if (currentAction === 'delete' && onBack) {
            onBack();
        }
    };

    // SPECIAL ACTIONS

    const handleStart = () => requestAction('start');

    //const handleComplete = () => requestAction('complete');
    const handleComplete = () =>
        requestAction('complete', {
            result: 'ok',
            comment: 'Terminé depuis header',
        });

    const handleClose = () => requestAction('close');
    const handleDelete = () => requestAction('delete');
    const handleUnassign = () => requestAction('unassign');
    const handleDuplicate = () => duplicateModal.onOpen();

    // Remplacez la fonction existante par celle-ci
    const confirmDuplicate = async () => {
        if (!onAction) return;

        // On attend la réponse du parent
        const result = await onAction('duplicate', {
            mode: duplicateMode,
            intervention_type_id: ticket.intervention_type?.id || null,
        });




        duplicateModal.onClose();
    };

    const handleShareQr = async () => {
        if (!ticket?.id) {
            toast({ title: "ID du ticket introuvable", status: "error" });
            return;
        }

        setIsGeneratingQr(true);
        try {
            // On utilise ton client 'api' (Axios) à la place de fetch
            const response = await api.get(`/api/v1/tickets/${ticket.id}/code_qr/`);

            // Avec ton apiClient (Axios), les données JSON sont DIRECTEMENT dans response.data
            const data = response.data;

            if (data.qr_code_url) {
                setQrCodeUrl(data.qr_code_url);
                qrModal.onOpen(); // Ou ta méthode pour ouvrir le modal
            } else {
                alert('Erreur lors de la génération du QR Code');
            }
        } catch (error: any) {
            console.error('Erreur Client lors du QR Code:', error);
            // Si Axios reçoit du HTML ou une 404, il lèvera une erreur propre ici
            alert(error?.response?.data?.detail || 'Une erreur est survenue lors de la communication avec le serveur.');
        } finally {
            setIsGeneratingQr(false);
        }
    };

    // ================= UI ACTIONS (STATE MACHINE) =================

    const actions = useMemo(() => {
        const s = ticket.status;
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
                variant: 'outline',
                show: showUnassign,
                onClick: handleUnassign,
            },
        ].filter(a => a.show);
    }, [ticket.status, ticket.technician_name]);

    const showDownloadBtn = ticket.permissions?.can_close || ticket.permissions?.can_duplicate;

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
                        {ticket.equipment?.name || 'Équipement'}
                    </Text>
                </VStack>

                {/* RIGHT ACTIONS */}
                <HStack spacing={3} flexWrap="wrap">

                    {onBack && (
                        <Button size="sm" variant="ghost" onClick={onBack} isDisabled={loading || isDownloadingPdf || isGeneratingQr}>
                            Retour
                        </Button>
                    )}

                    {/* PDF ACTIONS */}
                    {showDownloadBtn && onDownloadPdf && (
                        <>
                            <Button
                                size="sm"
                                colorScheme="blue"
                                variant="outline"
                                isLoading={isDownloadingPdf}
                                loadingText="Génération..."
                                onClick={onDownloadPdf}
                                isDisabled={loading || isGeneratingQr}
                            >
                                Télécharger PDF
                            </Button>

                            <Button
                                size="sm"
                                colorScheme="purple"
                                variant="solid"
                                isLoading={isGeneratingQr}
                                loadingText="Création..."
                                onClick={handleShareQr}
                                isDisabled={loading || isDownloadingPdf}
                            >
                                Partager QR
                            </Button>
                        </>
                    )}

                    {/* STATIC ACTIONS */}
                    {can(ticket.status, 'duplicate') && (
                        <Button
                            size="sm"
                            colorScheme="purple"
                            variant="outline"
                            onClick={handleDuplicate}
                            isDisabled={loading || isDownloadingPdf || isGeneratingQr}
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
                            isDisabled={loading || isDownloadingPdf || isGeneratingQr}
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
                            variant={a.variant || 'solid'}
                            onClick={a.onClick}
                            isDisabled={loading || isDownloadingPdf || isGeneratingQr}
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
                                <Box borderWidth="1px" p={3} borderRadius="md" w="100%">
                                    <Radio value="linked">Ticket lié</Radio>
                                </Box>
                                <Box borderWidth="1px" p={3} borderRadius="md" w="100%">
                                    <Radio value="independent">Indépendant</Radio>
                                </Box>
                            </VStack>
                        </RadioGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={duplicateModal.onClose} mr={3}>
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
                        <Button variant="ghost" onClick={confirmModal.onClose} mr={3}>
                            Annuler
                        </Button>
                        <Button
                            colorScheme={pending?.action === 'delete' || pending?.action === 'unassign' ? 'red' : 'blue'}
                            onClick={confirmAction}
                        >
                            Confirmer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ================= QR CODE MODAL ================= */}
            <Modal isOpen={qrModal.isOpen} onClose={qrModal.onClose} isCentered>
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent mx={4}>
                    <ModalHeader textAlign="center">Scanner pour télécharger le pdf</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} textAlign="center">
                            <Text fontSize="sm" color="gray.500">

                            </Text>

                            {qrCodeUrl && (
                                <Image
                                    boxSize="200px"
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                                    alt="QR Code de téléchargement"
                                    fallbackSrc="https://via.placeholder.com/200"
                                />
                            )}

                            <Text fontSize="xs" fontWeight="bold" color="red.200" bg="red.50" px={2} py={1} borderRadius="full">
                                Valide pendant 2 heures uniquement
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter justifyContent="center">
                        <Button colorScheme="blue" onClick={qrModal.onClose} size="sm">
                            Fermer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}