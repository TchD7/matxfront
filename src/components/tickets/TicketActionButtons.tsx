// components/TicketActionButtons.tsx
import { Button, useDisclosure, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/apiClient';
import type { TicketDetail } from './types/ticket';


interface Props {
    ticket: TicketDetail;
}

export const TicketActionButtons = ({ ticket }: Props) => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const { isOpen: isPauseOpen, onOpen: onPauseOpen, onClose: onPauseClose } = useDisclosure();
    const { isOpen: isResumeOpen, onOpen: onResumeOpen, onClose: onResumeClose } = useDisclosure();

    const pauseMutation = useMutation({
        mutationFn: () => api.post(`/api/v1/tickets/${ticket.id}/pause/`),
        onSuccess: () => handleSuccess('Intervention mise en pause avec succès', onPauseClose),
    });

    const resumeMutation = useMutation({
        mutationFn: () => api.post(`/api/v1/tickets/${ticket.id}/resume/`),
        onSuccess: () => handleSuccess('Intervention reprise avec succès', onResumeClose),
    });

    const handleSuccess = (message: string, closeFunction: () => void) => {
        closeFunction();
        queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
        toast({
            title: "Succès",
            description: message,
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top-right"
        });
    };

    if (ticket.status !== 'in_progress' && ticket.status !== 'paused') {
        return null; // N'afficher les boutons que dans les statuts pertinents
    }

    return (
        <>
            {ticket.status === 'in_progress' && (
                <Button colorScheme="yellow" onClick={onPauseOpen}>
                    Mettre en pause
                </Button>
            )}

            {ticket.status === 'paused' && (
                <Button colorScheme="green" onClick={onResumeOpen}>
                    Reprendre l'intervention
                </Button>
            )}

            {/* Modal de Pause */}
            <Modal isOpen={isPauseOpen} onClose={onPauseClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Mettre l'intervention en pause</ModalHeader>
                    <ModalBody>Confirmez-vous la mise en pause de cette intervention ?</ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onPauseClose} isDisabled={pauseMutation.isPending}>
                            Annuler
                        </Button>
                        <Button colorScheme="yellow" onClick={() => pauseMutation.mutate()} isLoading={pauseMutation.isPending}>
                            Confirmer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Modal de Reprise */}
            <Modal isOpen={isResumeOpen} onClose={onResumeClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Reprendre l'intervention</ModalHeader>
                    <ModalBody>Confirmez-vous la reprise de cette intervention ?</ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onResumeClose} isDisabled={resumeMutation.isPending}>
                            Annuler
                        </Button>
                        <Button colorScheme="green" onClick={() => resumeMutation.mutate()} isLoading={resumeMutation.isPending}>
                            Confirmer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};