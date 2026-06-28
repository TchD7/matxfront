import { FiAlertCircle, FiCalendar, FiCheckCircle, FiClock, FiPlay, FiPauseCircle } from 'react-icons/fi';

export const getPriorityColor = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
        case 'urgent':
        case 'high': return 'red';
        case 'medium': return 'orange';
        case 'low': return 'green';
        default: return 'blue';
    }
};

export const getProgressColor = (progress: number) => {
    if (progress <= 33) return 'red';
    if (progress <= 66) return 'orange';
    return 'green';
};

export const getCriticalityColor = (criticality?: string | null) => {
    switch (criticality?.toLowerCase()) {
        case 'critical': return 'red';
        case 'high': return 'orange';
        case 'medium': return 'yellow';
        default: return 'gray';
    }
};

export const getCriticalityLabel = (criticality?: string | null) => {
    switch (criticality?.toLowerCase()) {
        case 'critical': return 'Critique';
        case 'high': return 'Élevée';
        case 'medium': return 'Moyenne';
        default: return 'Normale';
    }
};

export const getStatusConfig = (status?: string) => {
    const normalized = status?.toLowerCase();

    switch (normalized) {
        case 'draft':
            return { icon: FiClock, label: 'Brouillon', color: 'gray', progress: 0, description: 'Le ticket est en brouillon.' };
        case 'planned':
            return { icon: FiCalendar, label: 'Planifié', color: 'purple', progress: 20, description: 'Le ticket est planifié.' };
        case 'in_progress':
        case 'in progress':
            return { icon: FiPlay, label: 'En cours', color: 'blue', progress: 60, description: 'Le ticket est en cours de traitement.' };
        case 'paused':
            return { icon: FiPauseCircle, label: 'En pause', color: 'yellow', progress: 60, description: "L'intervention est en pause." };
        case 'completed':
            return { icon: FiCheckCircle, label: 'Terminé', color: 'green', progress: 100, description: 'Le ticket est terminé.' };
        case 'closed':
            return { icon: FiAlertCircle, label: 'Clôturé', color: 'orange', progress: 100, description: 'Le ticket est fermé.' };
        default:
            return { icon: FiAlertCircle, label: 'Inconnu', color: 'gray', progress: 0, description: 'Statut inconnu.' };
    }
};