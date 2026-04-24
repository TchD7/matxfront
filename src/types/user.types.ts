/**
 * Types pour les utilisateurs
 */

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  is_active?: boolean;
  role?: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  role?: string;
}

export interface UsersResponse {
  results: User[];
  next?: string;
  previous?: string;
  count: number;
}

export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, string[]>;
}
