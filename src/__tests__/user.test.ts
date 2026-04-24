/**
 * Exemples de tests pour le système CRUD des utilisateurs
 * Utilise Vitest (configuration standard pour Vite)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  isValidName,
  validatePasswordStrength,
  formatFullName,
  formatDate,
  maskEmail,
  filterUsers,
  sortUsers,
  getUserStats,
  generateTemporaryPassword,
} from '../utils/userUtils';
import { validateCreateUser, validateUpdateUser } from '../schemas/userSchema';
import type { User } from '../types/user.types';

// ================= TESTS DE VALIDATION =================

describe('Validation', () => {
  describe('isValidEmail', () => {
    it('valide un email correct', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('rejette un email invalide', () => {
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('accepte un téléphone vide', () => {
      expect(isValidPhone('')).toBe(true);
    });

    it('valide un téléphone correct', () => {
      expect(isValidPhone('+33 6 12 34 56 78')).toBe(true);
      expect(isValidPhone('0612345678')).toBe(true);
    });
  });

  describe('isValidName', () => {
    it('rejette un nom trop court', () => {
      expect(isValidName('A')).toBe(false);
    });

    it('valide un nom correct', () => {
      expect(isValidName('Jean')).toBe(true);
      expect(isValidName("Jean-Pierre")).toBe(true);
    });
  });

  describe('validatePasswordStrength', () => {
    it('rejette un mot de passe faible', () => {
      const result = validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
    });

    it('valide un mot de passe fort', () => {
      const result = validatePasswordStrength('SecurePassword123!');
      expect(result.isValid).toBe(true);
    });
  });
});

// ================= TESTS DE SCHÉMAS =================

describe('Schémas Zod', () => {
  describe('validateCreateUser', () => {
    it('valide un payload de création correct', () => {
      const result = validateCreateUser({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@example.com',
        password: 'SecurePassword123!',
      });

      expect(result.success).toBe(true);
    });

    it('rejette un email invalide', () => {
      const result = validateCreateUser({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'invalid',
        password: 'SecurePassword123!',
      });

      expect(result.success).toBe(false);
      // @ts-ignore
      expect(result.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('rejette un mot de passe trop court', () => {
      const result = validateCreateUser({
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@example.com',
        password: 'short',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateUpdateUser', () => {
    it('valide une mise à jour partielle', () => {
      const result = validateUpdateUser({
        first_name: 'Marie',
      });

      expect(result.success).toBe(true);
    });
  });
});

// ================= TESTS DE FORMATAGE =================

describe('Formatage', () => {
  describe('formatFullName', () => {
    it('formate le nom complet correctement', () => {
      expect(formatFullName('Jean', 'Dupont')).toBe('Jean Dupont');
      expect(formatFullName('  Jean  ', '  Dupont  ')).toBe('Jean Dupont');
    });
  });

  describe('formatDate', () => {
    it('formate une date valide', () => {
      const result = formatDate('2024-01-15T00:00:00Z');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('retourne "-" pour une date invalide', () => {
      expect(formatDate('invalid')).toBe('-');
    });
  });

  describe('maskEmail', () => {
    it('masque une adresse email', () => {
      const result = maskEmail('jean.dupont@example.com');
      expect(result).toContain('*');
      expect(result).toContain('example.com');
    });
  });
});

// ================= TESTS DE FILTRAGE =================

describe('Filtrage et tri', () => {
  let users: User[];

  beforeEach(() => {
    users = [
      {
        id: 1,
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@example.com',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'marie@example.com',
        is_active: false,
        created_at: '2024-01-02T00:00:00Z',
      },
    ];
  });

  describe('filterUsers', () => {
    it('filtre par nom', () => {
      const result = filterUsers(users, 'Jean');
      expect(result).toHaveLength(1);
      expect(result[0].first_name).toBe('Jean');
    });

    it('filtre par email', () => {
      const result = filterUsers(users, 'marie@example.com');
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('marie@example.com');
    });

    it('retourne tous les utilisateurs si recherche vide', () => {
      const result = filterUsers(users, '');
      expect(result).toHaveLength(2);
    });
  });

  describe('sortUsers', () => {
    it('trie par nom', () => {
      const result = sortUsers(users, 'name');
      expect(result[0].first_name).toBe('Jean');
      expect(result[1].first_name).toBe('Marie');
    });

    it('trie par email en ordre inverse', () => {
      const result = sortUsers(users, 'email', false);
      expect(result[0].email).toBe('marie@example.com');
    });
  });
});

// ================= TESTS DE STATISTIQUES =================

describe('Statistiques', () => {
  it('calcule les stats correctement', () => {
    const users: User[] = [
      {
        id: 1,
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@example.com',
        is_active: true,
      },
      {
        id: 2,
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'marie@example.com',
        is_active: false,
      },
    ];

    const stats = getUserStats(users);

    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.inactive).toBe(1);
    expect(stats.activePercentage).toBe(50);
  });
});

// ================= TESTS DE GÉNÉRATION =================

describe('Génération', () => {
  it('génère un mot de passe temporaire', () => {
    const password = generateTemporaryPassword();

    expect(password).toHaveLength(12);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
  });

  it('génère des mots de passe différents', () => {
    const pwd1 = generateTemporaryPassword();
    const pwd2 = generateTemporaryPassword();

    expect(pwd1).not.toBe(pwd2);
  });
});

// ================= INSTRUCTIONS D'EXÉCUTION =================

/*
Pour exécuter les tests:

1. Installer Vitest (déjà inclus généralement avec Vite):
   npm install -D vitest

2. Ajouter dans package.json:
   "scripts": {
     "test": "vitest"
   }

3. Exécuter les tests:
   npm run test

4. Mode watch:
   npm run test -- --watch

5. Couverture de code:
   npm run test -- --coverage
*/
