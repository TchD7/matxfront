// types/ticket.ts

export type TicketStatus = 'draft' | 'planned' | 'in_progress' | 'paused' | 'completed' | 'closed';

export interface TicketLog {
  id: number;
  created_at: string;
  user_name: string;
  action: string;
}

// On fusionne TicketDetail et Ticket pour avoir une interface unique et propre
export interface Ticket {
    id: string | number;
    status: TicketStatus | string; // Accept les deux pour la flexibilité
    created_at: string;
    started_at?: string | null;
    ended_at?: string | null;
    planned_at?: string | null;
    is_breakdown?: boolean;
    priority?: string | null;
    equipment?: {
        name?: string;
        code?: string;
        criticality?: string;
        emplacement?: string;
        series?: string;
        marque?: string;
    } | null;
    technician_name?: string | null;
    intervention_type?: {
        name?: string;
    } | null;
    is_late?: boolean;
    start_delay_minutes?: number | null;
    late_duration_minutes?: number | null;
    total_work_minutes?: number;
    pause_minutes?: number;
    pause_count?: number;
    logs?: TicketLog[];
}

export interface TicketStatusDetailProps {
    ticket: Ticket;
}