import { Badge } from '@chakra-ui/react';

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
export default function TicketStatusBadge({ status }: { status: string }) {
    const statusInfo = getStatus(status);

    return (
        <Badge colorScheme={statusInfo.color} variant="solid" borderRadius="full" px={3}>
            {statusInfo.label}
        </Badge>
    );
}