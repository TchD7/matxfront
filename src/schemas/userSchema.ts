/**
 * Schémas de validation pour les utilisateurs
 * Utilise Zod pour valider les données côté client
 */

import { z } from 'zod';

// Schéma pour la validation des emails
const emailSchema = z
  .string()
  .email('Email invalide')
  .min(5, 'Email trop court')
  .max(255, 'Email trop long');

// Schéma pour la validation des noms
const nameSchema = z
  .string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(150, 'Le nom ne peut pas dépasser 150 caractères')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides');

// Schéma pour la validation des téléphones
const phoneSchema = z
  .string()
  .regex(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    'Numéro de téléphone invalide'
  )
  .optional();

// Schéma pour la validation des mots de passe
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe est trop long')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

// Schéma pour la création d'utilisateur
export const createUserSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  is_active: z.boolean().default(true),
});

// Schéma pour la mise à jour d'utilisateur
export const updateUserSchema = z.object({
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  is_active: z.boolean().optional(),
});

// Schéma pour l'utilisateur retourné par l'API
export const userSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  is_active: z.boolean(),
  role: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Schéma pour la réponse paginée
export const usersResponseSchema = z.object({
  results: z.array(userSchema),
  next: z.string().url().optional(),
  previous: z.string().url().optional(),
  count: z.number(),
});

// Types TypeScript générés à partir des schémas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserData = z.infer<typeof userSchema>;
export type UsersResponseData = z.infer<typeof usersResponseSchema>;

/**
 * Valide les données de création d'utilisateur
 */
export function validateCreateUser(data: unknown) {
  try {
    return { success: true, data: createUserSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Erreur de validation' }],
    };
  }
}

/**
 * Valide les données de mise à jour d'utilisateur
 */
export function validateUpdateUser(data: unknown) {
  try {
    return { success: true, data: updateUserSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Erreur de validation' }],
    };
  }
}
