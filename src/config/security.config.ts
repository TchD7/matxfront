/**
 * Configuration et constantes de sécurité
 */

// ================= TOKENS & AUTH =================

/** Clé de stockage du token d'accès */
export const STORAGE_TOKEN_KEY = 'token';

/** Clé de stockage de l'URL du tenant */
export const STORAGE_TENANT_URL_KEY = 'tenant_api_url';

/** Clé de stockage de l'utilisateur */
export const STORAGE_USER_KEY = 'user_data';

/** Timeout des requêtes API (ms) */
export const API_TIMEOUT = 15000;

// ================= VALIDATION =================

/** Longueur minimale d'un mot de passe */
export const MIN_PASSWORD_LENGTH = 8;

/** Longueur maximale d'un mot de passe */
export const MAX_PASSWORD_LENGTH = 128;

/** Longueur minimale d'un nom */
export const MIN_NAME_LENGTH = 2;

/** Longueur maximale d'un nom */
export const MAX_NAME_LENGTH = 150;

/** Expression régulière pour les emails */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Expression régulière pour les téléphones */
export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

/** Expression régulière pour les noms (lettres, tirets, apostrophes, accents) */
export const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;

// ================= PAGINATION =================

/** Nombre par défaut d'éléments par page */
export const DEFAULT_PAGE_SIZE = 50;

/** Nombre maximum d'éléments par page */
export const MAX_PAGE_SIZE = 100;

// ================= MESSAGES =================

export const MESSAGES = {
  // Succès
  USER_CREATED: 'Utilisateur créé avec succès',
  USER_UPDATED: 'Utilisateur modifié avec succès',
  USER_DELETED: 'Utilisateur supprimé avec succès',
  USER_ACTIVATED: 'Utilisateur activé avec succès',
  USER_DEACTIVATED: 'Utilisateur désactivé avec succès',

  // Erreurs
  LOADING_ERROR: 'Impossible de charger les utilisateurs',
  CREATE_ERROR: 'Erreur lors de la création de l\'utilisateur',
  UPDATE_ERROR: 'Erreur lors de la mise à jour de l\'utilisateur',
  DELETE_ERROR: 'Impossible de supprimer l\'utilisateur',
  STATUS_ERROR: 'Impossible de modifier le statut de l\'utilisateur',
  VALIDATION_ERROR: 'Erreur de validation des données',
  NETWORK_ERROR: 'Pas de réponse du serveur',
  UNKNOWN_ERROR: 'Erreur inconnue',

  // Validation
  INVALID_EMAIL: 'L\'adresse email n\'est pas valide',
  INVALID_PASSWORD: 'Le mot de passe ne respecte pas les critères de sécurité',
  INVALID_NAME: 'Le nom contient des caractères invalides',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  PASSWORD_REQUIRED: 'Le mot de passe est obligatoire',
  EMAIL_REQUIRED: 'L\'email est obligatoire',
  NAME_REQUIRED: 'Le nom est obligatoire',

  // Confirmations
  CONFIRM_DELETE: 'Êtes-vous sûr de vouloir supprimer cet utilisateur?',
  DELETE_IRREVERSIBLE: 'Cette action est irréversible',
};

// ================= ROUTES API =================

export const API_ENDPOINTS = {
  USERS: '/api/v1/customers/users',
  USER_DETAIL: (id: number) => `/api/v1/customers/users/${id}`,
  USER_TOGGLE_STATUS: (id: number) => `/api/v1/customers/users/${id}/toggle-status`,
  AUTH_REFRESH: '/api/v1/customers/auth/token/refresh/',
};

// ================= SECURITY HEADERS =================

export const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

// ================= RATE LIMITING =================

/** Délai entre les requêtes pour éviter les abus (ms) */
export const RATE_LIMIT_DELAY = 300;

/** Nombre maximum de tentatives avant blocage */
export const MAX_RETRY_ATTEMPTS = 3;

/** Délai d'attente entre les tentatives (ms) */
export const RETRY_DELAY = 1000;

// ================= ROLES & PERMISSIONS =================

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  MANAGE_ROLES: 'manage_roles',
};

// ================= COULEURS & STYLES =================

export const COLORS = {
  SUCCESS: 'green',
  ERROR: 'red',
  WARNING: 'orange',
  INFO: 'blue',
};

export const BADGE_COLORS = {
  ACTIVE: 'green',
  INACTIVE: 'red',
  PENDING: 'orange',
};
