/**
 * Utilitaires pour le système CRUD des utilisateurs
 */

import { User } from '../types/user.types';
import { EMAIL_REGEX, PHONE_REGEX, NAME_REGEX } from '../config/security.config';

// ================= VALIDATION =================

/**
 * Valide un format d'email
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Valide un numéro de téléphone
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Le téléphone est optionnel
  return PHONE_REGEX.test(phone);
}

/**
 * Valide un nom
 */
export function isValidName(name: string): boolean {
  if (!name || name.trim().length < 2) return false;
  return NAME_REGEX.test(name);
}

/**
 * Valide la force d'un mot de passe
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Min. 8 caractères');
  } else {
    score++;
  }

  if (password.length >= 12) {
    score++;
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Au moins une minuscule');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Au moins une majuscule');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Au moins un chiffre');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Au moins un caractère spécial');
  }

  return {
    isValid: feedback.length === 0,
    score,
    feedback,
  };
}

// ================= FORMATAGE =================

/**
 * Formate un nom complet
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Formate un email en masquant une partie
 */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;

  const visibleChars = Math.max(1, name.length - 3);
  const masked = name.substring(0, visibleChars) + '*'.repeat(Math.max(1, name.length - visibleChars));
  return `${masked}@${domain}`;
}

/**
 * Formate un téléphone
 */
export function formatPhone(phone: string): string {
  if (!phone) return '-';

  // Enlever tous les caractères non numériques sauf le +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Retourner avec des espacements
  return cleaned.replace(/(.{3})/g, '$1 ').trim();
}

// ================= FILTRAGE & RECHERCHE =================

/**
 * Filtre une liste d'utilisateurs par terme de recherche
 */
export function filterUsers(users: User[], searchTerm: string): User[] {
  if (!searchTerm.trim()) return users;

  const term = searchTerm.toLowerCase();

  return users.filter((user) => {
    const fullName = formatFullName(user.first_name, user.last_name).toLowerCase();
    const email = user.email.toLowerCase();

    return fullName.includes(term) || email.includes(term);
  });
}

/**
 * Trie une liste d'utilisateurs
 */
export function sortUsers(
  users: User[],
  sortBy: 'name' | 'email' | 'date' = 'name',
  ascending: boolean = true
): User[] {
  const sorted = [...users];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = formatFullName(a.first_name, a.last_name).localeCompare(
          formatFullName(b.first_name, b.last_name)
        );
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'date':
        comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        break;
    }

    return ascending ? comparison : -comparison;
  });

  return sorted;
}

// ================= STATISTIQUES =================

/**
 * Calcule les statistiques des utilisateurs
 */
export function getUserStats(users: User[]): {
  total: number;
  active: number;
  inactive: number;
  activePercentage: number;
} {
  const total = users.length;
  const active = users.filter((u) => u.is_active).length;
  const inactive = total - active;
  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;

  return {
    total,
    active,
    inactive,
    activePercentage,
  };
}

// ================= EXPORT & IMPORT =================

/**
 * Exporte les utilisateurs en CSV
 */
export function exportUsersToCSV(users: User[], filename = 'utilisateurs.csv'): void {
  const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Statut', 'Date de création'];
  const rows = users.map((user) => [
    user.first_name,
    user.last_name,
    user.email,
    user.phone || '',
    user.is_active ? 'Actif' : 'Inactif',
    formatDate(user.created_at || ''),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ================= UTILITAIRES DE SÉCURITÉ =================

/**
 * Génère un mot de passe temporaire sécurisé
 */
export function generateTemporaryPassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  const all = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Mélanger le mot de passe
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Sanitize une chaîne pour éviter les injections XSS
 */
export function sanitizeString(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Clone un utilisateur (créer une copie profonde)
 */
export function cloneUser(user: User): User {
  return JSON.parse(JSON.stringify(user));
}
