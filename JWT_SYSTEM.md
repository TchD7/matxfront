# 🔐 Système JWT SimpleJWT - Documentation Complète

## 📋 Vue d'ensemble

Ce document explique le système JWT (JSON Web Token) implémenté côté frontend avec les meilleures pratiques production (comme Stripe, GitHub, Notion).

---

## 🎯 Architecture générale

```
┌─────────────────────────────────────────────────────────┐
│         APPLICATION FRONTEND (React + TypeScript)       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ AuthContext (État utilisateur)                   │  │
│  │ - user: User | null                              │  │
│  │ - isAuthenticated: boolean                       │  │
│  │ - login() / logout()                             │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ authService.ts (Logique métier)                  │  │
│  │ - loginUser()                                    │  │
│  │ - refreshAccessToken()                           │  │
│  │ - logoutUser()                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ apiClient.ts (Gestion JWT)                       │  │
│  │ ┌─ TokenManager (classe interne)               │  │
│  │ │ - Stockage: localStorage                     │  │
│  │ │ - Tokens: access_token, refresh_token        │  │
│  │ │ - Queue: Retry automatique pendant refresh   │  │
│  │ └─────────────────────────────────────────────┘  │
│  │ ┌─ Interceptors HTTP (Axios)                  │  │
│  │ │ - Request: Ajoute Authorization header      │  │
│  │ │ - Response: Gère 401 + refresh automatique  │  │
│  │ └─────────────────────────────────────────────┘  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Axios Instance (HTTP Client)                     │  │
│  │ - baseURL: http://localhost:8000                │  │
│  │ - timeout: 15000ms                              │  │
│  │ - withCredentials: true (cookies)               │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Backend API (Django + SimpleJWT)                 │  │
│  │ POST   /api/v1/customers/auth/login/           │  │
│  │ POST   /api/v1/customers/auth/token/refresh/   │  │
│  │ GET    /api/v1/customers/users/                │  │
│  │ ...                                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Gestion des tokens JWT

### 1. **Stockage des tokens**

Les tokens sont stockés dans `localStorage` avec des clés précises :

```typescript
// Clés de stockage
const TOKEN_KEYS = {
  ACCESS: "jwt_access_token", // Token court terme (~5 min)
  REFRESH: "jwt_refresh_token", // Token long terme (~24h)
  TENANT_URL: "tenant_api_url", // URL du tenant (multi-tenant)
};
```

**Pourquoi localStorage ?**

- ✅ Persistant après rechargement de page
- ✅ Accessible aux requêtes HTTP
- ✅ Simple et standard

⚠️ **Note de sécurité**: En production, considérez `httpOnly` cookies (côté serveur), mais localStorage fonctionne bien pour les SPAs modernes avec CORS.

### 2. **Classe TokenManager**

Gère l'état des tokens et la queue de retry :

```typescript
class TokenManager {
  // État interne
  private accessToken: string | null;
  private refreshToken: string | null;
  private isRefreshing = false; // Flag de refresh en cours
  private refreshQueue: Array<() => void> = []; // Queue de retry

  // Méthodes publiques
  setTokens(access, refresh?); // Sauvegarde les tokens
  getAccessToken(); // Récupère le token d'accès
  getRefreshToken(); // Récupère le token de refresh
  clear(); // Supprime tous les tokens
  isRefreshInProgress(); // Vérification du flag
  addToRefreshQueue(callback); // Ajoute à la queue
  processRefreshQueue(); // Exécute la queue
}
```

---

## 🔄 Flux d'authentification

### Étape 1️⃣ : Connexion initiale

```typescript
// Component: LoginPassword.tsx
const handleSubmit = async () => {
  const { data } = await api.post("/api/v1/customers/auth/login/", {
    username,
    password,
  });

  // Réponse du serveur:
  // {
  //   access: "eyJ0eXAiOiJKV1QiLCJhbGc...",    // Token court terme
  //   refresh: "eyJ0eXAiOiJKV1QiLCJhbGc...",   // Token long terme
  //   user: { id, username, email, ... },
  //   tenant_domain: "client1.api.com",
  //   tenant_url: "https://client1.api.com"
  // }

  // 1️⃣ Sauvegarder les tokens
  setTokens(data.access, data.refresh); // → localStorage

  // 2️⃣ Mettre à jour le contexte utilisateur
  login(data.user, data.access);

  // 3️⃣ Changer l'URL de base pour le tenant
  updateApiBaseURL(data.tenant_domain);

  // ✅ Redirection vers dashboard
  navigate("/dashboard");
};
```

### Étape 2️⃣ : Requête API protégée

```
1. Component effectue une requête API
   ↓
   await userService.fetchUsers()
   ↓
   api.get('/api/v1/customers/users/')

2. ✅ REQUEST INTERCEPTOR
   ├─ Récupère le access token
   ├─ Ajoute le header: Authorization: Bearer <token>
   └─ Envoie la requête

3. 📡 SERVER répond avec 200 ✅
   ├─ Response Interceptor: laisse passer
   └─ Component reçoit les données

   OU

   📡 SERVER répond avec 401 ❌ (Token expiré)
   ├─ Response Interceptor déclenché
   └─ Voir étape 3️⃣
```

### Étape 3️⃣ : Refresh automatique du token

```typescript
// Response Interceptor (apiClient.ts)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ❌ Erreur 401 détectée
    if (error.response?.status === 401) {
      // 🔒 Vérifier si refresh token existe
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        // ❌ Pas de refresh token → Logout forcé
        await logout(); // Redirection vers /
        return;
      }

      // 🔄 Si refresh déjà en cours, ajouter à la queue
      if (tokenManager.isRefreshInProgress()) {
        return new Promise((resolve, reject) => {
          tokenManager.addToRefreshQueue(async () => {
            // Quand le refresh est terminé, réessayer
            const newAccessToken = tokenManager.getAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      // 🟡 Marquer le refresh comme en cours
      tokenManager.setRefreshing(true);

      try {
        // 🔑 Appeler l'endpoint de refresh
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/v1/customers/auth/token/refresh/`,
          { refresh: refreshToken },
          { withCredentials: true },
        );

        // ✅ Sauvegarder les nouveaux tokens
        tokenManager.setTokens(data.access, data.refresh);
        console.log("✅ Tokens refreshés");

        // 🔄 Rejouer la requête initiale
        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        // 🚀 Exécuter toutes les requêtes en attente
        tokenManager.processRefreshQueue();

        return api(originalRequest); // ✅ Recommencer
      } catch (refreshError) {
        // ❌ Le refresh a échoué
        console.error("Refresh failed - forcing logout");
        tokenManager.clear();
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        tokenManager.setRefreshing(false);
      }
    }

    return Promise.reject(error);
  },
);
```

---

## 📡 Service d'authentification (authService.ts)

Centralise tous les appels API d'auth :

```typescript
// Connexion
await loginUser(username, password);

// Refresh (appelé automatiquement par interceptor)
await refreshAccessToken();

// Logout
await logoutUser();

// Réinitialisation de mot de passe
await requestPasswordReset(username);
await resetPassword(token, password, password2);

// Acceptation d'invitation
await verifyInvitationToken(token);
await acceptInvitation(token, password, password2);
```

---

## 🛡️ Sécurité

### ✅ Points de sécurité implémentés

1. **Tokens séparés**
   - `access_token`: Court terme (~5 min), requêtes quotidiennes
   - `refresh_token`: Long terme (~24h), renouvellement du session

2. **Pas d'exposition du token**
   - ✅ Jamais dans l'URL
   - ✅ Jamais dans le state global (sauf localStorage)
   - ✅ Nettoyage automatique au logout

3. **Refresh automatique**
   - ✅ L'utilisateur ne voit jamais "Token expired"
   - ✅ Queue de retry pour les requêtes simultanées
   - ✅ Une seule requête de refresh pour N requêtes

4. **XSS Protection**
   - ✅ Les tokens ne sont pas en JS global
   - ✅ localStorage n'est accessible qu'en HTTPS + Origin
   - ⚠️ En production: Utiliser `httpOnly` cookies + CSRF tokens

---

## 🧪 Scénarios de test

### Scénario 1: Connexion réussie

```
✅ POST /login → { access, refresh, user, ... }
✅ Tokens sauvegardés
✅ Contexte utilisateur mis à jour
✅ Redirection vers /dashboard
```

### Scénario 2: Requête API avec token valide

```
✅ GET /users
✅ Authorization: Bearer <access_token>
✅ 200 OK → Données reçues
```

### Scénario 3: Token expiré, refresh réussi

```
❌ GET /users → 401 Unauthorized
🔄 POST /token/refresh/ → { access: <new_token>, refresh: ... }
✅ GET /users (retry) → 200 OK
✅ Utilisateur ne voit rien
```

### Scénario 4: Refresh token expiré

```
❌ GET /users → 401 Unauthorized
❌ POST /token/refresh/ → 401 Unauthorized
🚨 localStorage.clear()
🚨 Redirection vers /
❌ Force la reconnexion
```

### Scénario 5: Logout

```
✅ POST /logout (optional, server-side session cleanup)
✅ localStorage.clear()
✅ AuthContext.user = null
🚨 Redirection vers /
```

---

## 📚 Files du système

```
src/
├── api/
│   ├── apiClient.ts          # 🎯 Cœur du système JWT
│   │                          # - TokenManager
│   │                          # - Interceptors
│   │                          # - Exports publics
│   ├── authService.ts         # Appels API d'auth
│   └── userService.ts         # Exemple CRUD
│
├── context/
│   └── AuthContext.tsx        # État utilisateur (React)
│                               # Synchronisé avec apiClient
│
├── components/
│   └── forms/
│       ├── LoginPassword.tsx   # Connexion
│       ├── ResetPassword.tsx   # Demande reset
│       └── ResetPasswordToken.tsx # Compléter reset
│
├── pages/
│   ├── LoginPage.tsx           # Page de connexion
│   ├── Dashboard.tsx           # Zone protégée
│   └── AcceptInvitation.tsx    # Acceptation invit.
│
└── hooks/
    └── useAuth.ts             # Hook pour accéder au contexte
```

---

## 🚀 Déploiement en production

### Checklist avant production

- [ ] HTTPS activé
- [ ] CORS configuré correctement
- [ ] `withCredentials: true` utilisé
- [ ] Tokens passés en header `Authorization`
- [ ] Refresh token rotation implémenté (optionnel côté backend)
- [ ] Expiration des tokens configurée (5-15 min pour access)
- [ ] Logout nettoie complètement la session
- [ ] Erreurs 401 gérées gracieusement
- [ ] Tests du refresh automatique
- [ ] Monitoring des erreurs JWT

### Optimisations possibles

1. **HttpOnly Cookies** (Plus sécurisé)

   ```typescript
   // Côté backend: SET-COOKIE header
   Set-Cookie: jwt_access=...; HttpOnly; Secure; SameSite=Strict
   ```

2. **Refresh Token Rotation**

   ```typescript
   // Chaque refresh retourne un nouveau refresh token
   const { data } = await api.post("/token/refresh/", { refresh });
   // data.refresh est un nouveau token
   ```

3. **Événements de sécurité**
   ```typescript
   // Log les tentatives de refresh échouées
   // Alerte si > N tentatives en 1 min
   ```

---

## 📖 Exemples d'utilisation

### Composant avec authentification

```typescript
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" />;

  return (
    <div>
      <h1>Bienvenue, {user.username}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Service d'API personnalisé

```typescript
import api from "../api/apiClient";

export const fetchUserData = async (userId: number) => {
  try {
    const { data } = await api.get(`/api/v1/users/${userId}/`);
    // ✅ Token automatiquement ajouté
    // ✅ Si 401, refresh automatique
    return data;
  } catch (error) {
    console.error("Erreur:", error);
  }
};
```

---

## ⚠️ Problèmes courants et solutions

### Problème: "Token is expired"

```
❌ Cause: Access token expiré, pas de refresh
✅ Solution:
  - Vérifier que refresh token est sauvegardé
  - Vérifier que POST /token/refresh/ fonctionne
  - Vérifier les en-têtes CORS
```

### Problème: Boucle infinie de refreshes

```
❌ Cause: isRefreshing pas remis à false
✅ Solution:
  - finally { isRefreshing = false } exécuté
  - Erreur réseau pendant refresh?
```

### Problème: Token pas envoyé

```
❌ Cause: Authorization header pas ajouté
✅ Solution:
  - Vérifier REQUEST interceptor
  - Vérifier skipAuth n'est pas défini
  - Vérifier token existe dans localStorage
```

---

## 🎉 Résumé final

✅ **Système JWT production-ready**

- Access + Refresh tokens
- Stockage persistant (localStorage)
- Interceptors Axios pour automatisation
- Queue de retry sans blocage UX
- Gestion élégante des expirations
- Logout complet et sécurisé

🚀 **L'utilisateur ne doit jamais voir "Token expired"**

- Le refresh est silencieux
- Les requêtes sont rejouées automatiquement
- L'expérience reste fluide
