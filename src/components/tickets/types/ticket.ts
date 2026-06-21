// types/ticket.ts
export type TicketStatus = 'draft' | 'planned' | 'in_progress' | 'paused' | 'completed' | 'closed';

export interface TicketLog {
  id: number;
  created_at: string; // ISO date string
  user_name: string;
  action: string;
}

export interface TicketDetail {
  id: number;
  status: TicketStatus;
  started_at: string | null;
  ended_at: string | null;
  planned_at: string | null;
  is_late: boolean;
  start_delay_minutes: number | null;
  late_duration_minutes: number | null;
  total_work_minutes: number;
  pause_minutes: number;
  pause_count: number;
  logs: TicketLog[];
}

// utils/timeHelpers.ts
/**
 * Convertit un nombre de minutes en format "Xh Ymin" ou "Xmin"
 */
export const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes || minutes <= 0) return '0 min';
  
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  
  return `${h}h ${m}min`;
};