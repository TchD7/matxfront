/**
 * Service d'authentification JWT (SimpleJWT)
 * Gère les appels API d'authentification et les tokens
 */

import api, { setTokens, getAccessToken, getRefreshToken, clearAllTokens, logout } from './apiClient';

interface LoginResponse {
  access: string;
  refresh?: string;
  user: any;
  tenant_domain?: string;
  tenant_url?: string;
}

interface RefreshResponse {
  access: string;
  refresh?: string;
}

/**
 * Effectue un login et sauvegarde les tokens
 */
export const loginUser = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const { data } = await api.post<LoginResponse>(
      '/api/v1/customers/auth/login/',
      { username, password }
    );

    // Sauvegarder les tokens JWT
    setTokens(data.access, data.refresh || null);

    return data;
  } catch (error) {
    console.error('❌ Erreur de login:', error);
    throw error;
  }
};

/**
 * Rafraîchit le access token avec le refresh token
 * ⚠️ Normalement appelé automatiquement par l'interceptor
 */
export const refreshAccessToken = async (): Promise<RefreshResponse> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('❌ Pas de refresh token disponible');
  }

  try {
    const { data } = await api.post<RefreshResponse>(
      '/api/v1/customers/auth/token/refresh/',
      { refresh: refreshToken },
      { skipAuth: true } as any
    );

    setTokens(data.access, data.refresh || null);
    console.log('✅ Access token refreshé');

    return data;
  } catch (error) {
    console.error('❌ Erreur refresh token:', error);
    // Si le refresh échoue, forcer le logout
    clearAllTokens();
    throw error;
  }
};

/**
 * Logout l'utilisateur et nettoie tous les tokens
 */
export const logoutUser = async (): Promise<void> => {
  try {
    const accessToken = getAccessToken();
    if (accessToken) {
      await api.post(
        '/api/v1/customers/users/logout/',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors du logout côté serveur:', error);
  } finally {
    // Toujours nettoyer les tokens côté client
    clearAllTokens();
  }
};

/**
 * Envoie une demande de réinitialisation de mot de passe
 */
export const requestPasswordReset = async (username: string): Promise<any> => {
  try {
    const { data } = await api.post(
      '/api/v1/customers/auth/forgot-password/',
      { username },
      { skipAuth: true } as any
    );
    return data;
  } catch (error) {
    console.error('❌ Erreur demande reset password:', error);
    throw error;
  }
};

/**
 * Réinitialise le mot de passe avec un token
 */
export const resetPassword = async (
  token: string,
  password: string,
  password2: string
): Promise<any> => {
  try {
    const { data } = await api.post(
      `/api/v1/customers/auth/reset-password/${token}/`,
      { password, password2 },
      { skipAuth: true } as any
    );
    return data;
  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    throw error;
  }
};

/**
 * Accepte une invitation avec un token et définit le mot de passe
 */
export const acceptInvitation = async (
  token: string,
  password: string,
  password2: string
): Promise<any> => {
  try {
    const { data } = await api.post(
      `/api/v1/customers/auth/accept-invitation/${token}/`,
      { token, password, password2 },
      { skipAuth: true } as any
    );
    return data;
  } catch (error) {
    console.error('❌ Erreur accept invitation:', error);
    throw error;
  }
};

/**
 * Vérifie la validité d'un token d'invitation
 */
export const verifyInvitationToken = async (token: string): Promise<any> => {
  try {
    const { data } = await api.get(
      `/api/v1/customers/auth/accept-invitation/${token}/`,
      { skipAuth: true } as any
    );
    return data;
  } catch (error) {
    console.error('❌ Erreur vérification token invitation:', error);
    throw error;
  }
};

export default {
  loginUser,
  refreshAccessToken,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  acceptInvitation,
  verifyInvitationToken,
};
