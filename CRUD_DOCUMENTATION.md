# Système CRUD Sécurisé pour les Utilisateurs

## 📋 Vue d'ensemble

Ce système CRUD offre une gestion complète et sécurisée des utilisateurs avec les fonctionnalités suivantes:

- ✅ **Création** d'utilisateurs avec validation
- ✅ **Lecture** avec pagination et recherche
- ✅ **Modification** partielle des données
- ✅ **Suppression** avec confirmation
- ✅ **Activation/Désactivation** rapide

## 🏗️ Architecture

### Structure des fichiers

```
src/
├── api/
│   ├── apiClient.ts          # Client axios configuré avec intercepteurs
│   └── userService.ts         # Service CRUD des utilisateurs
├── components/
│   └── dashboard/
│       └── UserManager.tsx    # Composant d'interface utilisateur
├── context/
│   └── AuthContext.tsx        # Gestion de l'authentification
├── hooks/
│   ├── useAuth.ts            # Hook pour accéder au contexte
│   └── useUsersCrud.ts        # Hook pour la logique CRUD
├── schemas/
│   └── userSchema.ts          # Schémas de validation Zod
└── types/
    └── user.types.ts          # Types TypeScript
```

## 🔐 Sécurité

### Mesures implémentées

1. **Validation côté client** avec Zod
   - Validation des emails
   - Validation des mots de passe (min 8 caractères, majuscule, minuscule, chiffre)
   - Validation des noms
   - Validation des numéros de téléphone

2. **Authentification**
   - Les tokens sont stockés dans localStorage
   - Les requêtes incluent automatiquement le token Bearer
   - Refresh automatique du token en cas d'expiration

3. **Gestion des erreurs**
   - Messages d'erreur clairs
   - Pas d'exposition des détails sensibles
   - Logs d'erreur côté client

4. **Contrôle d'accès**
   - AuthGuard protège les routes sensibles
   - Vérification du token avant accès

## 📖 Utilisation

### 1. Utiliser le composant UserManager

```tsx
import UserManager from "@/components/dashboard/UserManager";

export default function Dashboard() {
  return <UserManager />;
}
```

### 2. Utiliser le hook useUsersCrud

```tsx
import { useUsersCrud } from "@/hooks/useUsersCrud";

export function MyComponent() {
  const {
    users,
    loading,
    error,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
  } = useUsersCrud({
    pageSize: 50,
    onSuccess: (message) => console.log(message),
    onError: (error) => console.error(error),
  });

  // Charger les utilisateurs
  useEffect(() => {
    loadUsers();
  }, []);

  // Créer un utilisateur
  const handleCreate = async () => {
    try {
      await createUser({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "SecurePassword123!",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {loading && <p>Chargement...</p>}
      {error && <p>Erreur: {error}</p>}
      {/* Afficher les utilisateurs */}
    </div>
  );
}
```

### 3. Utiliser le service userService directement

```tsx
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "@/api/userService";

// Récupérer tous les utilisateurs
const response = await fetchUsers(1, 10, "recherche");

// Créer un utilisateur
const newUser = await createUser({
  first_name: "Marie",
  last_name: "Dupont",
  email: "marie@example.com",
  password: "SecurePassword123!",
});

// Modifier un utilisateur
const updated = await updateUser(1, {
  first_name: "Marie-Claire",
});

// Supprimer un utilisateur
await deleteUser(1);

// Basculer le statut
const toggled = await toggleUserStatus(1);
```

## 🛡️ Validation des données

### Schémas disponibles

- `createUserSchema` - Validation pour la création
- `updateUserSchema` - Validation pour la modification

### Exemple de validation manuelle

```tsx
import { validateCreateUser, validateUpdateUser } from "@/schemas/userSchema";

const result = validateCreateUser({
  first_name: "Jean",
  last_name: "Dupont",
  email: "jean@example.com",
  password: "SecurePassword123!",
});

if (result.success) {
  console.log("Données valides", result.data);
} else {
  console.error("Erreurs de validation", result.errors);
}
```

## 📱 Fonctionnalités du composant UserManager

### Actions disponibles

| Action                 | Description                              | Raccourci                              |
| ---------------------- | ---------------------------------------- | -------------------------------------- |
| **Créer**              | Ajouter un nouvel utilisateur            | Bouton "Nouvel Utilisateur"            |
| **Modifier**           | Éditer les informations d'un utilisateur | Menu > Modifier                        |
| **Supprimer**          | Supprimer un utilisateur                 | Menu > Supprimer                       |
| **Activer/Désactiver** | Changer le statut rapidement             | Cliquez sur le badge de statut ou Menu |
| **Rechercher**         | Filtrer par nom ou email                 | Barre de recherche                     |

### Responsive Design

- **Desktop**: Tableau complet avec toutes les colonnes
- **Mobile**: Cartes avec les informations essentielles

## 🚀 Optimisations

1. **useCallback** - Mémoïsation des fonctions
2. **useReducer** - Gestion d'état performante
3. **Lazy loading** - Chargement des utilisateurs à la demande
4. **Pagination** - Limitation du nombre d'éléments par page
5. **Recherche débounced** - Évite les appels API excessifs

## ⚠️ Gestion d'erreurs

Le système gère automatiquement:

- Erreurs réseau
- Erreurs d'authentification (401)
- Erreurs de validation (400)
- Erreurs serveur (500)
- Messages d'erreur clairs pour l'utilisateur

## 📝 Type de données

```typescript
interface User {
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

interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  is_active?: boolean;
  role?: string;
}

interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  role?: string;
}
```

## 🔄 Flux de travail typique

```
1. Composant charge → loadUsers()
2. État loading = true
3. API fetch users
4. État users = résultats
5. Rendu du tableau
6. Utilisateur clique sur "Modifier"
7. Modal s'ouvre
8. Utilisateur modifie les données
9. Validation côté client
10. Envoi updateUser(id, data)
11. API traite
12. État users mis à jour
13. Toast de confirmation
14. Modal ferme
```

## 🐛 Dépannage

### Erreur: "useUsersCrud doit être utilisé dans un AuthProvider"

**Solution**: Vérifiez que votre app est enveloppée par `AuthProvider` dans `main.tsx`.

### Erreur 401: Token expiré

**Solution**: Le système renouvelle automatiquement le token. Si ça persiste, reconnectez-vous.

### Les données ne se chargent pas

**Solution**:

- Vérifiez que l'API est accessible
- Vérifiez le token dans localStorage
- Vérifiez la console pour les erreurs

## 📞 Support

Pour toute question ou problème, consultez les logs de la console de navigation.
