/**
 * Service CRUD pour les utilisateurs
 * Centralise toutes les opérations API pour la gestion des utilisateurs
 */

import api from './apiClient';
import type { User, CreateUserPayload, UpdateUserPayload, UsersResponse, ApiError } from '../types/user.types';

const BASE_URL = '/api/v1/customers/users';

// ================= LECTURE =================

/**
 * Récupère tous les utilisateurs avec pagination
 * @param page Numéro de la page (par défaut 1)
 * @param limit Nombre d'éléments par page (par défaut 10)
 */
export const fetchUsers = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<UsersResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const { data } = await api.get<UsersResponse>(`${BASE_URL}/?${params.toString()}`);
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Récupère un utilisateur par son ID
 */
export const fetchUserById = async (userId: number): Promise<User> => {
  try {
    const { data } = await api.get<User>(`${BASE_URL}/${userId}/`);
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ================= CRÉATION =================

/**
 * Crée un nouvel utilisateur
 * @param payload Données du nouvel utilisateur
 */
export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  try {
    // Validation basique
    validateUserData(payload);
    
    const { data } = await api.post<User>(BASE_URL + '/', payload);
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ================= MODIFICATION =================

/**
 * Met à jour un utilisateur existant
 * @param userId ID de l'utilisateur à mettre à jour
 * @param payload Données à mettre à jour
 */
export const updateUser = async (
  userId: number,
  payload: UpdateUserPayload
): Promise<User> => {
  try {
    const { data } = await api.patch<User>(`${BASE_URL}/${userId}/`, payload);
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ================= SUPPRESSION =================

/**
 * Supprime un utilisateur
 * @param userId ID de l'utilisateur à supprimer
 */
export const deleteUser = async (userId: number): Promise<void> => {
  try {
    await api.delete(`${BASE_URL}/${userId}/`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Bascule le statut actif/inactif d'un utilisateur
 */
export const toggleUserStatus = async (userId: number): Promise<User> => {
  try {
    // Récupérer l'utilisateur actuel
    const user = await fetchUserById(userId);
    
    // Mettre à jour le statut
    const { data } = await api.patch<User>(`${BASE_URL}/${userId}/`, {
      is_active: !user.is_active,
    });
    
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ================= VALIDATION =================

/**
 * Valide les données utilisateur avant envoi à l'API
 */
function validateUserData(data: CreateUserPayload | UpdateUserPayload) {
  // Validation de l'email
  if (data.email && !isValidEmail(data.email)) {
    throw new Error('L\'adresse email n\'est pas valide');
  }

  // Validation du nom
  if ('first_name' in data && data.first_name && data.first_name.trim().length < 2) {
    throw new Error('Le prénom doit contenir au moins 2 caractères');
  }

  if ('last_name' in data && data.last_name && data.last_name.trim().length < 2) {
    throw new Error('Le nom doit contenir au moins 2 caractères');
  }

  // Validation du mot de passe pour la création
  if ('password' in data && data.password && data.password.length < 8) {
    throw new Error('Le mot de passe doit contenir au moins 8 caractères');
  }
}

/**
 * Valide un format d'email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ================= GESTION D'ERREURS =================

/**
 * Traite les erreurs API et les formate de manière cohérente
 */
function handleApiError(error: any): ApiError {
  if (error.response) {
    // Erreur de réponse du serveur
    return {
      message: error.response.data?.detail || error.response.data?.message || 'Erreur serveur',
      status: error.response.status,
      details: error.response.data?.errors || error.response.data,
    };
  } else if (error.request) {
    // Erreur de requête (pas de réponse)
    return {
      message: 'Pas de réponse du serveur',
      status: 0,
    };
  } else if (error instanceof Error) {
    // Erreur locale (validation, etc.)
    return {
      message: error.message,
      status: -1,
    };
  }
  
  return {
    message: 'Erreur inconnue',
    status: -1,
  };
}
