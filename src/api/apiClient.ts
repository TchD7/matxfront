import axios from 'axios';
import type { AxiosInstance } from 'axios';

// ============================================================
// 🔐 JWT TOKEN MANAGEMENT SYSTEM
// Gestion complète et robuste des tokens SimpleJWT
// ============================================================

const API_CENTRAL = import.meta.env.VITE_API_URL;
const REFRESH_URL = import.meta.env.VITE_REFRESH_URL;

// ================= TOKEN STORAGE =================
const TOKEN_KEYS = {
  ACCESS: 'jwt_access_token',
  REFRESH: 'jwt_refresh_token',
  TENANT_URL: 'tenant_api_url',
} as const;

/**
 * Récupère les tokens du localStorage
 */
const getStoredTokens = () => ({
  access: localStorage.getItem(TOKEN_KEYS.ACCESS),
  refresh: localStorage.getItem(TOKEN_KEYS.REFRESH),
});

/**
 * Sauvegarde les tokens dans le localStorage
 */
const saveTokens = (access: string | null, refresh: string | null) => {
  if (access) {
    localStorage.setItem(TOKEN_KEYS.ACCESS, access);
  } else {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
  }
  
  if (refresh) {
    localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
  } else {
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
  }
};

/**
 * Supprime tous les tokens du localStorage
 */
const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
};

// ================= API CLIENT SETUP =================
const getInitialBaseURL = () => {
  return localStorage.getItem(TOKEN_KEYS.TENANT_URL) || API_CENTRAL;
};

const api: AxiosInstance = axios.create({
  baseURL: getInitialBaseURL(),
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================= TOKEN MANAGEMENT =================
class TokenManager {
  private accessToken: string | null;
  private refreshToken: string | null;
  private isRefreshing = false;
  private refreshQueue: Array<() => void> = [];

  constructor() {
    const { access, refresh } = getStoredTokens();
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  setTokens(access: string, refresh?: string | null) {
    this.accessToken = access;
    if (refresh !== undefined) {
      this.refreshToken = refresh || null;
    }
    saveTokens(access, this.refreshToken);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clear() {
    this.accessToken = null;
    this.refreshToken = null;
    clearTokens();
  }

  /**
   * Ajoute une fonction à la queue de refresh
   * Utile pour éviter les race conditions lors des requêtes simultanées
   */
  addToRefreshQueue(callback: () => void) {
    this.refreshQueue.push(callback);
  }

  /**
   * Exécute toutes les fonctions en attente de refresh
   */
  processRefreshQueue() {
    this.refreshQueue.forEach((cb) => cb());
    this.refreshQueue = [];
  }

  /**
   * Indique si un refresh est en cours
   */
  isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }

  setRefreshing(value: boolean) {
    this.isRefreshing = value;
  }
}

const tokenManager = new TokenManager();

// ================= TENANT URL MANAGEMENT =================
export const updateApiBaseURL = (tenantDomain: string) => {
  if (!tenantDomain) return;

  const protocol = window.location.protocol;
  const newUrl = tenantDomain.startsWith('http')
    ? tenantDomain
    : `${protocol}//${tenantDomain}`;

  localStorage.setItem(TOKEN_KEYS.TENANT_URL, newUrl);
  api.defaults.baseURL = newUrl;
};

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use(
  (config: any) => {
    // Skip auth si marqué explicitement
    if (config.skipAuth) {
      delete config.skipAuth;
      return config;
    }

    // Ajouter le access token à chaque requête
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
/**
 * Interceptor de réponses pour gérer les erreurs 401 et les refreshs de tokens
 * Suit le pattern de SimpleJWT avec access/refresh token strategy
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ne pas boucler si c'est déjà un retry
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // ============ ERREUR 401 - TOKEN EXPIRÉ ============
    if (error.response?.status === 401) {
      originalRequest._retry = true;

      // Si aucun refresh token, on doit forcer le logout
      if (!tokenManager.getRefreshToken()) {
        console.warn('Pas de refresh token disponible - Logout forcé');
        await logout();
        return Promise.reject(error);
      }

      // Si un refresh est déjà en cours, on ajoute la requête à la queue
      if (tokenManager.isRefreshInProgress()) {
        return new Promise((resolve, reject) => {
          tokenManager.addToRefreshQueue(async () => {
            try {
              // Mettre à jour le header avec le nouveau token
              const newAccessToken = tokenManager.getAccessToken();
              if (newAccessToken) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              }
              resolve(api(originalRequest));
            } catch (err) {
              reject(err);
            }
          });
        });
      }

      // Marquer que le refresh est en cours
      tokenManager.setRefreshing(true);

      try {
        const refreshToken = tokenManager.getRefreshToken();
        
        
        
        const { data } = await axios.post(
          `${api.defaults.baseURL}/${REFRESH_URL}`, 
          { refresh: refreshToken },
          {
            // On ajoute un flag pour que l'intercepteur sache qu'il ne doit pas 
            // traiter cette requête s'il y a une erreur 401 (pour éviter la boucle infinie)
            headers: { 'Content-Type': 'application/json' },
            _retry: true 
          }
        );

        // Sauvegarder les nouveaux tokens (Access ET Refresh car ROTATE=True)
        tokenManager.setTokens(data.access, data.refresh);
        console.log('✅ Tokens refreshés avec succès');

        // Mettre à jour la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        // Exécuter toutes les requêtes en queue
        tokenManager.processRefreshQueue();

        // Rejouer la requête initiale
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('❌ Erreur lors du refresh des tokens:', refreshError.response?.data);

        // Le refresh a échoué - forcer le logout
        tokenManager.clear();
        localStorage.removeItem(TOKEN_KEYS.TENANT_URL);
        window.location.href = '/';

        return Promise.reject(refreshError);
      } finally {
        tokenManager.setRefreshing(false);
      }
    }

    // ============ AUTRES ERREURS ============
    return Promise.reject(error);
  }
);

// ================= PUBLIC EXPORTS =================
/**
 * Définit les tokens après une connexion réussie
 */
export const setTokens = (access: string, refresh?: string | null) => {
  tokenManager.setTokens(access, refresh);
};

/**
 * Récupère le access token
 */
export const getAccessToken = (): string | null => {
  return tokenManager.getAccessToken();
};

/**
 * Récupère le refresh token
 */
export const getRefreshToken = (): string | null => {
  return tokenManager.getRefreshToken();
};

/**
 * Nettoie tous les tokens
 */
export const clearAllTokens = () => {
  tokenManager.clear();
};

/**
 * Logout complète
 */
export const logout = async () => {
  const currentBaseUrl = api.defaults.baseURL;

  try {
    // Tenter un logout côté serveur
    if (tokenManager.getAccessToken()) {
      await axios.post(
        `${currentBaseUrl}/api/v1/customers/users/logout/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
          withCredentials: true,
        }
      );
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors du logout côté serveur:', error);
  } finally {
    // Nettoyage complet côté client
    clearAllTokens();
    localStorage.removeItem(TOKEN_KEYS.TENANT_URL);
    window.location.href = '/';
  }
};

// Backward compatibility
export const setAccessToken = (token: string | null) => {
  if (token) {
    tokenManager.setTokens(token, tokenManager.getRefreshToken());
  }
};

export default api;
