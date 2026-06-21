// src/utils/timeHelpers.ts

/**
 * Convertit un nombre total de minutes en une chaîne de caractères lisible.
 * Exemples : 
 * - 45 -> "45 min"
 * - 135 -> "2h 15min"
 * - 120 -> "2h"
 * - 0 / null -> "0 min"
 */
export const formatDuration = (minutes: number | null | undefined): string => {
    if (minutes == null || minutes <= 0) {
        return '0 min';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
        return `${remainingMinutes} min`;
    }

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`;
};