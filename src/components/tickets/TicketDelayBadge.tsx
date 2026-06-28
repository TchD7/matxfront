import { Badge } from '@chakra-ui/react';
import type { Ticket } from './types/ticket'; // Assure-toi que le chemin est correct
import { formatDuration } from '../../utils/timeHelpers';

interface Props {
    // On utilise Pick<Ticket, ...> maintenant que Ticket contient tous les champs
    ticket: Pick<Ticket, 'status' | 'is_late' | 'late_duration_minutes' | 'start_delay_minutes'>;
}

export const TicketDelayBadge = ({ ticket }: Props) => {
    const { status, is_late, late_duration_minutes, start_delay_minutes } = ticket;

    // Ticket planifié et en retard (avant démarrage)
    if (status === 'planned' && is_late) {
        return (
            <Badge colorScheme="red" variant="subtle" fontSize="sm" px={2} borderRadius="md">
                RETARD : {formatDuration(late_duration_minutes)}
            </Badge>
        );
    }

    // Ticket ayant démarré (en cours, en pause, terminé, etc.) avec un retard accusé
    const hasStarted = ['in_progress', 'paused', 'completed', 'closed'].includes(status as string);
    const hasDelay = start_delay_minutes && start_delay_minutes > 0;

    if (hasStarted && hasDelay) {
        return (
            <Badge colorScheme="orange" variant="subtle" fontSize="sm" px={2} borderRadius="md">
                RETARD ACCUSÉ : {formatDuration(start_delay_minutes)}
            </Badge>
        );
    }

    return null;
};