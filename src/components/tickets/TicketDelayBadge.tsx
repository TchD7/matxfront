// components/TicketDelayBadge.tsx
import { Badge } from '@chakra-ui/react';
import type { TicketDetail } from './types/ticket';
import { formatDuration } from './types/ticket';

interface Props {
    ticket: Pick<TicketDetail, 'status' | 'is_late' | 'late_duration_minutes' | 'start_delay_minutes'>;
}

export const TicketDelayBadge = ({ ticket }: Props) => {
    const { status, is_late, late_duration_minutes, start_delay_minutes } = ticket;

    // Ticket planifié et en retard (avant démarrage)
    if (status === 'planned' && is_late) {
        return (
            <Badge colorScheme="red" fontSize="md" p={2} borderRadius="md">
                RETARD : {formatDuration(late_duration_minutes)}
            </Badge>
        );
    }

    // Ticket ayant démarré (en cours, en pause, terminé, etc.) avec un retard accusé
    const hasStarted = ['in_progress', 'paused', 'completed', 'closed'].includes(status);
    const hasDelay = start_delay_minutes && start_delay_minutes > 0;

    if (hasStarted && hasDelay) {
        return (
            <Badge colorScheme="orange" fontSize="md" p={2} borderRadius="md">
                RETARD ACCUSÉ : {formatDuration(start_delay_minutes)}
            </Badge>
        );
    }

    // Aucun retard à afficher
    return null;
};