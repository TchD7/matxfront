import api from '../api/apiClient';

// ================= TYPES =================
export type TicketAction =
    | 'assign'
    | 'start'
    | 'complete'
    | 'close'
    | 'duplicate';

// ================= ASSIGN =================
export const assignTicket = async (
    ticketId: string,
    data: {
        technician_id: number;
        planned_at: string;
    }
) => {
    return api.post(`/api/v1/tickets/${ticketId}/assign/`, data);
};

// ================= START =================
export const startTicket = async (
    ticketId: string,
    data: {
        technician_id: number;
    }
) => {
    return api.post(`/api/v1/tickets/${ticketId}/start/`, data);
};

// ================= COMPLETE =================
export const completeTicket = async (
    ticketId: string,
    data: {
        technician_id: number;
        result: 'ok' | 'nok';
        reason?: number | null;
        comment?: string;
    }
) => {
    return api.post(`/api/v1/tickets/${ticketId}/complete/`, data);
};

// ================= CLOSE =================
export const closeTicket = async (ticketId: string) => {
    return api.post(`/api/v1/tickets/${ticketId}/close/`);
};

// ================= DELETE =================
export const deleteTicket = async (ticketId: string) => {
    return api.delete(`/api/v1/tickets/${ticketId}/`);
};

// ================= DUPLICATE =================
export const duplicateTicket = async (
    ticketId: string,
    data: {
        mode?: 'linked' | 'copy';
        intervention_type_id?: number | null;
        copy_fields?: boolean;
    }
) => {
    return api.post(`/api/v1/tickets/${ticketId}/duplicate/`, data);
};

// ================= DISPATCHER (OPTIONAL WRAPPER) =================
export const ticketActions = {
    assign: assignTicket,
    start: startTicket,
    complete: completeTicket,
    close: closeTicket,
    duplicate: duplicateTicket,
};