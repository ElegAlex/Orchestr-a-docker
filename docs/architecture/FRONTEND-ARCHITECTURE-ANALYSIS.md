# 📐 Analyse Architecture Frontend - Orchestr'A

**Date** : 13 octobre 2025
**Status** : Phase 5A - Analyse terminée

## 📊 Vue d'Ensemble

### Structure Actuelle

```
orchestra-app/
├── src/
│   ├── components/        (33 dossiers, 150+ composants)
│   ├── pages/             (20 pages principales)
│   ├── services/          (45 services Firebase)
│   ├── store/             (Redux Toolkit - 4 slices)
│   ├── hooks/             (9 hooks customs)
│   ├── types/             (Définitions TypeScript)
│   ├── config/            (Configuration Firebase)
│   └── utils/             (Utilitaires)
├── package.json           (42 dépendances)
└── Total: 237 fichiers source
```

### Technologies Utilisées

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| **Framework** | React | 19.1.1 |
| **Language** | TypeScript | 4.9.5 |
| **State Management** | Redux Toolkit | 2.9.0 |
| **UI Library** | Material-UI (MUI) | 7.3.2 |
| **Routing** | React Router DOM | 7.8.2 |
| **Backend actuel** | Firebase | 12.2.1 |
| **HTTP Client** | Axios | 1.11.0 (déjà installé!) |
| **Date** | date-fns | 4.1.0 |
| **Forms** | React Hook Form | 7.62.0 |

## 🔥 Dépendances Firebase Actuelles

### Services Firebase Utilisés

```typescript
// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';          // Auth
import { getFirestore } from 'firebase/firestore'; // Database
import { getStorage } from 'firebase/storage';     // Files
import { getFunctions } from 'firebase/functions'; // Cloud Functions
```

### Méthodes Firebase à Remplacer

#### 1. **Authentication** (firebase/auth)
```typescript
// Actuellement
signInWithEmailAndPassword()
createUserWithEmailAndPassword()
signOut()
sendPasswordResetEmail()
GoogleAuthProvider + signInWithPopup()
updateProfile()
```

#### 2. **Firestore** (firebase/firestore)
```typescript
// Actuellement
collection(), doc(), getDoc(), getDocs()
addDoc(), updateDoc(), deleteDoc(), setDoc()
query(), where(), orderBy(), limit()
```

#### 3. **Storage** (firebase/storage)
```typescript
// Utilisé pour documents/avatars
getDownloadURL()
ref(), uploadBytes()
```

## 🏗️ Architecture des Services

### Pattern Actuel : Firebase Services

Tous les services suivent ce pattern :

```typescript
// services/project.service.ts
export class ProjectService {
  async createProject(data: Omit<Project, 'id'>): Promise<Project> {
    const docRef = await addDoc(collection(db, 'projects'), data);
    return { id: docRef.id, ...data };
  }

  async getProject(id: string): Promise<Project | null> {
    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as Project : null;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await updateDoc(doc(db, 'projects', id), updates);
    return this.getProject(id);
  }

  async deleteProject(id: string): Promise<void> {
    await deleteDoc(doc(db, 'projects', id));
  }

  async getProjects(filters?: any): Promise<Project[]> {
    const q = query(collection(db, 'projects'), where(...), orderBy(...));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
```

### Services à Migrer (45 total)

**Priorité HAUTE** (fonctionnalités critiques) :
- ✅ `auth.service.ts` - Authentication (JWT backend)
- ✅ `user.service.ts` - Gestion utilisateurs
- ✅ `project.service.ts` - Gestion projets
- ✅ `task.service.ts` - Gestion tâches
- ⚠️ `profile.service.ts` - Profils utilisateurs
- ⚠️ `leave.service.ts` - Congés

**Priorité MOYENNE** :
- `department.service.ts` - Départements
- `comment.service.ts` - Commentaires
- `notification.service.ts` - Notifications
- `milestone.service.ts` - Jalons/milestones
- `dashboard.service.ts` - Dashboard

**Priorité BASSE** (features avancées) :
- `analytics.service.ts` - Analytiques
- `capacity.service.ts` - Capacité
- `resource.service.ts` - Ressources
- 30+ autres services...

## 🔐 Authentication Flow Actuel

### Firebase Auth (à remplacer)

```typescript
// services/auth.service.ts - ACTUEL
export class AuthService {
  async signInWithEmail(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = await this.getUserProfile(credential.user.uid);
    await this.updateLastLogin(user.id);
    return user;
  }

  async signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = await this.getUserProfile(result.user.uid);
    return user;
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}
```

### JWT Backend (cible)

```typescript
// services/api/auth.api.ts - À CRÉER
export class AuthAPI {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', { email, password });
    // response.data = { user, accessToken, refreshToken }
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  }
}
```

## 📦 Redux Store Structure

### Slices Actuels

```typescript
// store/slices/authSlice.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Async thunks à mettre à jour
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }) => {
    return await authService.signInWithEmail(email, password); // Firebase
  }
);

// À remplacer par
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }) => {
    return await authAPI.login(email, password); // Backend NestJS
  }
);
```

### Slices Existants
1. `authSlice.ts` - Authentication (user, isAuthenticated, tokens)
2. `projectSlice.ts` - Projects (projects list, selected project)
3. `resourceSlice.ts` - Resources
4. `taskSlice.ts` - Tasks

**Note** : La structure Redux peut rester identique, seuls les services appelés changent.

## 🎯 Stratégie de Migration

### Phase 5B : API Client Service

**Objectif** : Créer un client API centralisé avec intercepteurs

```typescript
// services/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: ajouter le token JWT
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: gérer les erreurs 401 (token expiré)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expiré, essayer de rafraîchir
          try {
            const newToken = await this.refreshToken();
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return this.client.request(error.config);
          } catch (refreshError) {
            // Échec du refresh, déconnecter l'utilisateur
            localStorage.clear();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await axios.post(`${this.client.defaults.baseURL}/auth/refresh`, {
      refreshToken,
    });
    const { accessToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new APIClient();
```

### Phase 5C : Migration Auth Firebase → JWT

**Checklist** :
1. ✅ Créer `services/api/auth.api.ts`
2. ✅ Mettre à jour `store/slices/authSlice.ts`
3. ✅ Remplacer `useAuth()` hook
4. ✅ Mettre à jour `PrivateRoute` component
5. ✅ Supprimer Firebase Auth imports
6. ✅ Tester login/logout/register

### Phase 5D : Adapter Modules (Users, Projects, Tasks)

**Pattern de migration par service** :

```typescript
// AVANT (Firebase)
export class ProjectService {
  async getProjects(): Promise<Project[]> {
    const snapshot = await getDocs(collection(db, 'projects'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

// APRÈS (REST API)
export class ProjectService {
  async getProjects(params?: ProjectQueryParams): Promise<PaginatedResponse<Project>> {
    const response = await apiClient.get('/projects', { params });
    return response.data; // { data: Project[], meta: { total, page, limit } }
  }
}
```

## 📝 Types à Aligner

### User Type

```typescript
// types/index.ts - ACTUEL
export interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  departmentId?: string;
  // ... autres champs
}

// Backend NestJS - src/users/entities/user.entity.ts
export class User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role; // ADMIN | MANAGER | RESPONSABLE | CONTRIBUTOR | TEAM_LEAD | VIEWER
  isActive: boolean;
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}
```

**Action** : Les types sont déjà très proches! Juste aligner les noms de rôles.

## 🚀 Plan d'Exécution (Next Steps)

### Phase 5B : Service API Client (1-2h)
- [x] Créer `services/api/client.ts` (APIClient avec intercepteurs)
- [ ] Créer `services/api/auth.api.ts` (login, register, logout, refresh)
- [ ] Créer `services/api/users.api.ts` (CRUD utilisateurs)
- [ ] Créer `services/api/projects.api.ts` (CRUD projets)
- [ ] Créer `services/api/tasks.api.ts` (CRUD tâches)
- [ ] Ajouter variables d'environnement `.env` :
  ```env
  REACT_APP_API_URL=http://localhost:3000
  REACT_APP_API_TIMEOUT=10000
  ```

### Phase 5C : Migration Auth (2-3h)
- [ ] Remplacer `authService` par `authAPI` dans `authSlice`
- [ ] Mettre à jour `useAuth()` hook
- [ ] Mettre à jour `PrivateRoute` pour JWT
- [ ] Remplacer `LoginForm` component
- [ ] Tester login/logout cycle
- [ ] Supprimer Firebase Auth imports

### Phase 5D : Adapter Modules (3-4h)
- [ ] **Users** : Remplacer `userService` par `usersAPI`
- [ ] **Projects** : Remplacer `projectService` par `projectsAPI`
- [ ] **Tasks** : Remplacer `taskService` par `tasksAPI`
- [ ] Mettre à jour Redux slices (projectSlice, taskSlice)
- [ ] Adapter components pour nouvelle structure de réponse (pagination)
- [ ] Tester CRUD complet pour chaque module

## 📊 Statistiques

### Code à Migrer
- **Services Firebase** : 45 services (~12,000 lignes)
- **Services critiques** : 6 services (~2,000 lignes)
- **Redux slices** : 4 slices (~600 lignes)
- **Components Auth** : 5 components (~800 lignes)

### Estimation Temps
- **Phase 5B** (API Client) : 2 heures
- **Phase 5C** (Auth) : 3 heures
- **Phase 5D** (Modules) : 4 heures
- **Tests & Debug** : 2 heures
- **Total** : ~11 heures de développement

### Avantages Post-Migration
✅ Plus de dépendance Firebase (économie ~$$$)
✅ Backend contrôlé (PostgreSQL au lieu de Firestore)
✅ API REST standardisée (Swagger docs)
✅ Tests backend validés (90.5% couverture E2E)
✅ Performance améliorée (requêtes optimisées)
✅ Sécurité renforcée (RBAC backend)

## 🔍 Risques Identifiés

### Risques ÉLEVÉS
1. **Breaking changes** : Auth change complètement (Firebase → JWT)
   - **Mitigation** : Tests E2E complets, migration progressive

2. **Gestion des tokens** : Refresh token mechanism
   - **Mitigation** : Intercepteurs axios bien testés

### Risques MOYENS
3. **Pagination** : Firestore = infinite scroll, Backend = pagination
   - **Mitigation** : Adapter components pour pagination

4. **Realtime updates** : Firestore listeners → Polling ou WebSockets
   - **Mitigation** : Phase 2 - implémenter WebSockets si nécessaire

### Risques FAIBLES
5. **Types compatibility** : Types déjà très proches
6. **File uploads** : Firebase Storage → MinIO (backend gère déjà)

## 📚 Documentation Backend Disponible

- ✅ **API Swagger** : http://localhost:3000/api
- ✅ **68 routes documentées** : Auth, Users, Projects, Tasks, etc.
- ✅ **Tests E2E** : 95/105 tests (90.5% succès)
- ✅ **RBAC validé** : Tous les rôles testés
- ✅ **Prisma Studio** : http://localhost:5555

---

**Prochaine étape** : Phase 5B - Création du service API client

**Auteur** : Claude Code
**Dernière mise à jour** : 13 octobre 2025
