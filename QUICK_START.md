# 🚀 Guide d'intégration rapide - Système CRUD Utilisateurs

## ⚡ Démarrage rapide (5 minutes)

### 1️⃣ Intégrer dans votre Dashboard

```tsx
// src/pages/Dashboard.tsx
import UserManager from "@/components/dashboard/UserManager";

export default function Dashboard() {
  return (
    <div>
      <UserManager />
    </div>
  );
}
```

### 2️⃣ Vérifier que AuthProvider est configuré

```tsx
// src/main.tsx
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <SaasProvider>
        <AuthProvider>
          {" "}
          {/* ✅ Présent */}
          <App />
        </AuthProvider>
      </SaasProvider>
    </ChakraProvider>
  </React.StrictMode>,
);
```

### 3️⃣ C'est tout! 🎉

Le système CRUD est maintenant actif avec:

- ✅ Liste des utilisateurs
- ✅ Créer utilisateur
- ✅ Modifier utilisateur
- ✅ Supprimer utilisateur
- ✅ Activer/Désactiver
- ✅ Recherche

---

## 📁 Fichiers créés

```
✨ NOUVEAUX:
├── src/api/userService.ts              # Service CRUD
├── src/hooks/useUsersCrud.ts           # Hook personnalisé
├── src/types/user.types.ts             # Types TypeScript
├── src/schemas/userSchema.ts           # Validation Zod
├── src/config/security.config.ts       # Configuration
├── src/utils/userUtils.ts              # Utilitaires
├── src/__tests__/user.test.ts          # Tests

📝 MODIFIÉS:
├── src/components/dashboard/UserManager.tsx     # Interface complète
├── src/context/AuthContext.tsx                  # État auth amélioré
├── src/hooks/useAuth.ts                        # Hook auth

📚 DOCUMENTATION:
├── CRUD_DOCUMENTATION.md               # Doc détaillée
└── SYSTEM_SUMMARY.md                   # Vue d'ensemble
```

---

## 🔍 Structure de la base de données attendue

L'API doit avoir cet endpoint:

```
GET    /api/v1/customers/users/              # Lister
POST   /api/v1/customers/users/              # Créer
PATCH  /api/v1/customers/users/{id}/         # Modifier
DELETE /api/v1/customers/users/{id}/         # Supprimer
```

**Payload de création:**

```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean@example.com",
  "phone": "+33 6 12 34 56 78",
  "password": "SecurePass123!",
  "is_active": true
}
```

**Réponse API attendue:**

```json
{
  "results": [
    {
      "id": 1,
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean@example.com",
      "phone": "+33 6 12 34 56 78",
      "is_active": true,
      "created_at": "2024-04-21T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 💻 Exemples d'utilisation avancée

### Utiliser le hook personnalisé

```tsx
import { useUsersCrud } from "@/hooks/useUsersCrud";
import { useEffect } from "react";

export function MyComponent() {
  const { users, loading, error, loadUsers, createUser, deleteUser } =
    useUsersCrud({
      pageSize: 20,
      onSuccess: (msg) => console.log("✅", msg),
      onError: (err) => console.error("❌", err),
    });

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAdd = async () => {
    try {
      await createUser({
        first_name: "Alice",
        last_name: "Martin",
        email: "alice@example.com",
        password: "SecurePass123!",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleAdd}>Ajouter</button>
      {loading && <p>Chargement...</p>}
      {users.map((u) => (
        <p key={u.id}>
          {u.first_name} {u.last_name}
        </p>
      ))}
    </div>
  );
}
```

### Utiliser le service directement

```tsx
import { createUser, updateUser, deleteUser } from "@/api/userService";

// Créer
const newUser = await createUser({
  first_name: "Marie",
  last_name: "Dupont",
  email: "marie@example.com",
  password: "SecurePass123!",
});

// Modifier
const updated = await updateUser(newUser.id, {
  first_name: "Marie-Claire",
});

// Supprimer
await deleteUser(updated.id);
```

### Valider des données

```tsx
import { validateCreateUser } from "@/schemas/userSchema";

const result = validateCreateUser({
  first_name: "Jean",
  last_name: "Dupont",
  email: "jean@example.com",
  password: "SecurePass123!",
});

if (result.success) {
  console.log("Données valides:", result.data);
} else {
  console.error("Erreurs:", result.errors);
  // Afficher les erreurs à l'utilisateur
}
```

---

## 🔐 Sécurité & Bonnes pratiques

✅ **À faire:**

- Valider côté serveur TOUJOURS
- Utiliser HTTPS en production
- Stocker les tokens dans localStorage (ou cookie httpOnly si possible)
- Implémenter un refresh token
- Limiter les tentatives de création (rate limiting)

❌ **À éviter:**

- Envoyer des mots de passe en clair
- Stocker des données sensibles en localStorage
- Faire confiance aux validations client
- Exposer les détails techniques dans les erreurs
- Laisser les tokens expiré sans refresh

---

## 📊 Cas d'utilisation courants

### 1. Récupérer et afficher une liste

```tsx
const { users, loadUsers } = useUsersCrud();

useEffect(() => {
  loadUsers();
}, []);

// Afficher dans un tableau, liste, etc.
```

### 2. Créer avec confirmation

```tsx
const handleCreate = async () => {
  const confirmed = window.confirm("Créer cet utilisateur?");
  if (!confirmed) return;

  await createUser({ ...data });
};
```

### 3. Modifier avec vérification

```tsx
const handleUpdate = async (userId: number) => {
  const updated = await updateUser(userId, {
    first_name: "Nouveau Nom",
  });

  // Optionnel: recharger la liste
  await loadUsers();
};
```

### 4. Supprimer avec log

```tsx
const handleDelete = async (userId: number) => {
  try {
    await deleteUser(userId);
    console.log(`Utilisateur ${userId} supprimé`);
  } catch (error) {
    console.error("Erreur suppression:", error);
  }
};
```

---

## 🐛 Dépannage courant

| Problème                          | Solution                                                      |
| --------------------------------- | ------------------------------------------------------------- |
| "Impossible de créer utilisateur" | Vérifier le format du mot de passe (min 8, MAJ, min, chiffre) |
| "Email invalide"                  | Utiliser un vrai format d'email (xxx@yyy.zzz)                 |
| "Pas de réponse du serveur"       | Vérifier que l'API est accessible                             |
| "401 Unauthorized"                | Vérifier le token dans localStorage                           |
| "Les données ne se chargent pas"  | Vérifier la console pour les erreurs                          |

---

## 📈 Performance

Pour les grandes listes:

```tsx
const { loadUsers } = useUsersCrud({
  pageSize: 100, // Augmenter la pagination
});

// Utiliser la recherche pour filtrer
await loadUsers("recherche");
```

---

## 🧪 Tester localement

### Avec mock data

```tsx
// Simuler la réponse API
const mockUsers = [
  {
    id: 1,
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];
```

### Avec Postman

```
POST /api/v1/customers/users/
Headers: Authorization: Bearer YOUR_TOKEN
Body: {
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean@example.com",
  "password": "SecurePass123!"
}
```

---

## ✅ Checklist d'intégration

- [ ] AuthProvider configuré dans main.tsx
- [ ] Dashboard importe UserManager
- [ ] API endpoint /api/v1/customers/users/ est fonctionnelle
- [ ] Token d'authentification fonctionne
- [ ] Pas d'erreurs de compilation
- [ ] Tester créer un utilisateur
- [ ] Tester modifier un utilisateur
- [ ] Tester supprimer un utilisateur
- [ ] Vérifier la recherche
- [ ] Vérifier le toggle de statut

---

## 🎓 Ressources

- [CRUD_DOCUMENTATION.md](./CRUD_DOCUMENTATION.md) - Documentation complète
- [SYSTEM_SUMMARY.md](./SYSTEM_SUMMARY.md) - Vue d'ensemble technique
- [Zod Documentation](https://zod.dev) - Validation
- [Chakra UI](https://chakra-ui.com) - Composants UI
- [React Hooks](https://react.dev/reference/react) - React

---

## 📞 Support

En cas de problème:

1. Vérifier les erreurs en console (F12)
2. Lire la documentation
3. Vérifier l'API répond correctement
4. Vérifier le token d'authentification

---

**Bon développement! 🚀**
