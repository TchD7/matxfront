export interface InterventionType {
  id: number;
  name: string;
  description?: string;
}
export interface Ticket {
  id: string; // UUID
  number?: string;

  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'closed' | 'paused';

  equipment_name?: string;

  completed_by_name?: string | null;
  assigned_to_name?: string | null;
  technician_name?: string | null;
 

  planned_at?: string | null;   // ISO date
  created_at?: string;          // ISO date
  updated_at?: string;          // ISO date
  started_at?: string | null;   // ISO date
  ended_at?: string | null;     // ISO date

  is_late?: boolean;

  estimated_duration?: number;
  duplication_index?: number;
  is_breakdown?: boolean;
  is_auto_generated?: boolean;
  form_version?: number;

  equipment?: string;           // UUID
  intervention_type?: InterventionType | null;  // FK id
  created_by?: number;          // FK id
  parent_ticket?: string | null;
  completed_by?: number | null;
  assigned_to?: number | null;
}
