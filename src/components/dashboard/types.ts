export interface Ticket {
    id: number;
    number?: string;

    status: string;

    equipment_name?: string;

    completed_by_name?: string;
    assigned_to_name?: string;

    planned_at?: string;
    created_at?: string;

    is_late?: boolean;
}