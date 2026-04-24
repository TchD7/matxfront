/**
 * Hook personnalisé pour la gestion des utilisateurs
 * Centralise la logique métier et les opérations CRUD
 */

import { useCallback, useReducer } from 'react';
import type { User, CreateUserPayload, UpdateUserPayload, ApiError } from '../types/user.types';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../api/userService';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
}

type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SELECT_USER'; payload: User | null }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: number }
  | { type: 'RESET' };

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
  selectedUser: null,
};

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SELECT_USER':
      return { ...state, selectedUser: action.payload };
    case 'ADD_USER':
      return { ...state, users: [action.payload, ...state.users] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.payload.id ? action.payload : u)),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface UseUsersCrudOptions {
  pageSize?: number;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

/**
 * Hook pour gérer les utilisateurs avec les opérations CRUD
 */
export function useUsersCrud(options: UseUsersCrudOptions = {}) {
  const { pageSize = 50, onSuccess, onError } = options;
  const [state, dispatch] = useReducer(userReducer, initialState);

  // ================= OPÉRATIONS DE LECTURE =================

  const loadUsers = useCallback(
    async (searchTerm?: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const response = await fetchUsers(1, pageSize, searchTerm);
        dispatch({ type: 'SET_USERS', payload: response.results });
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Erreur lors du chargement des utilisateurs';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        onError?.(errorMessage);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [pageSize, onError]
  );

  // ================= OPÉRATIONS DE CRÉATION =================

  const handleCreateUser = useCallback(
    async (payload: CreateUserPayload) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const newUser = await createUser(payload);
        dispatch({ type: 'ADD_USER', payload: newUser });
        onSuccess?.('Utilisateur créé avec succès');
        return newUser;
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Erreur lors de la création de l\'utilisateur';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        onError?.(errorMessage);
        throw err;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [onSuccess, onError]
  );

  // ================= OPÉRATIONS DE MODIFICATION =================

  const handleUpdateUser = useCallback(
    async (userId: number, payload: UpdateUserPayload) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const updatedUser = await updateUser(userId, payload);
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        onSuccess?.('Utilisateur modifié avec succès');
        return updatedUser;
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Erreur lors de la mise à jour de l\'utilisateur';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        onError?.(errorMessage);
        throw err;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [onSuccess, onError]
  );

  // ================= OPÉRATIONS DE SUPPRESSION =================

  const handleDeleteUser = useCallback(
    async (userId: number) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        await deleteUser(userId);
        dispatch({ type: 'DELETE_USER', payload: userId });
        onSuccess?.('Utilisateur supprimé avec succès');
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Erreur lors de la suppression de l\'utilisateur';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        onError?.(errorMessage);
        throw err;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [onSuccess, onError]
  );

  // ================= OPÉRATIONS DE BASCULEMENT STATUS =================

  const handleToggleStatus = useCallback(
    async (userId: number) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const updatedUser = await toggleUserStatus(userId);
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        const statusText = updatedUser.is_active ? 'activé' : 'désactivé';
        onSuccess?.(`Utilisateur ${statusText} avec succès`);
        return updatedUser;
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Erreur lors de la modification du statut';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        onError?.(errorMessage);
        throw err;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [onSuccess, onError]
  );

  // ================= ACTIONS D'INTERFACE =================

  const selectUser = useCallback((user: User | null) => {
    dispatch({ type: 'SELECT_USER', payload: user });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    // État
    users: state.users,
    loading: state.loading,
    error: state.error,
    selectedUser: state.selectedUser,

    // Opérations
    loadUsers,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    toggleStatus: handleToggleStatus,
    selectUser,
    clearError,
    reset,
  };
}

export default useUsersCrud;
