# 🔐 Phase 1 : Authentification JWT - Documentation Complète

> **Statut :** ✅ Implémentée
> **Date :** 11 octobre 2025
> **Durée :** Phase 1 (Semaines 1-2)

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture mise en place](#architecture-mise-en-place)
3. [Fichiers créés](#fichiers-créés)
4. [Comment ça marche ?](#comment-ça-marche)
5. [Tester l'authentification](#tester-lauthentification)
6. [Sécurité](#sécurité)
7. [Prochaines étapes](#prochaines-étapes)

---

## 🎯 Vue d'ensemble

### Qu'est-ce qui a été fait ?

La Phase 1 remplace **Firebase Authentication** par un système d'authentification JWT personnalisé et open-source.

**Avant (Firebase Auth) :**
```javascript
// Firebase
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const token = await user.getIdToken();
```

**Après (JWT personnalisé) :**
```javascript
// API REST
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { accessToken, refreshToken } = await response.json();
```

### Fonctionnalités implémentées

- ✅ **Inscription** (`POST /api/auth/register`)
- ✅ **Connexion** (`POST /api/auth/login`)
- ✅ **Rafraîchissement du token** (`POST /api/auth/refresh`)
- ✅ **Récupération du profil** (`GET /api/auth/me`)
- ✅ **Déconnexion** (`POST /api/auth/logout`)
- ✅ **Hash sécurisé des mots de passe** (bcrypt)
- ✅ **Tokens JWT** (access + refresh)
- ✅ **Guards de protection** (authentification + rôles)
- ✅ **Décorateurs personnalisés** (@Public, @Roles, @CurrentUser)

---

## 🏗️ Architecture mise en place

### Flux d'authentification complet

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant Prisma
    participant PostgreSQL

    Note over Client,PostgreSQL: 1. INSCRIPTION
    Client->>API: POST /api/auth/register
    API->>AuthService: register(dto)
    AuthService->>Prisma: findUnique(email)
    Prisma->>PostgreSQL: SELECT * FROM users WHERE email = ?
    PostgreSQL-->>Prisma: null (n'existe pas)
    AuthService->>AuthService: bcrypt.hash(password)
    AuthService->>Prisma: create(user)
    Prisma->>PostgreSQL: INSERT INTO users
    PostgreSQL-->>Prisma: user created
    AuthService->>AuthService: generateTokens(user)
    AuthService-->>API: { user, accessToken, refreshToken }
    API-->>Client: 201 Created + tokens

    Note over Client,PostgreSQL: 2. CONNEXION
    Client->>API: POST /api/auth/login
    API->>AuthService: login(dto)
    AuthService->>Prisma: findUnique(email)
    Prisma->>PostgreSQL: SELECT * FROM users WHERE email = ?
    PostgreSQL-->>Prisma: user found
    AuthService->>AuthService: bcrypt.compare(password, hash)
    AuthService->>AuthService: generateTokens(user)
    AuthService->>Prisma: update(lastLoginAt)
    AuthService-->>API: { user, accessToken, refreshToken }
    API-->>Client: 200 OK + tokens

    Note over Client,PostgreSQL: 3. REQUÊTE PROTÉGÉE
    Client->>API: GET /api/auth/me<br/>Authorization: Bearer <token>
    API->>JwtAuthGuard: canActivate()
    JwtAuthGuard->>JwtStrategy: validate(payload)
    JwtStrategy->>Prisma: findUnique(userId)
    Prisma->>PostgreSQL: SELECT * FROM users WHERE id = ?
    PostgreSQL-->>Prisma: user found
    JwtStrategy-->>JwtAuthGuard: user validated
    JwtAuthGuard-->>API: access granted
    API->>AuthService: getProfile(userId)
    AuthService->>Prisma: findUnique(userId)
    Prisma->>PostgreSQL: SELECT * FROM users
    PostgreSQL-->>Prisma: user data
    AuthService-->>API: user profile
    API-->>Client: 200 OK + profile

    Note over Client,PostgreSQL: 4. REFRESH TOKEN
    Client->>API: POST /api/auth/refresh<br/>{ refreshToken }
    API->>AuthService: refreshTokens(token)
    AuthService->>AuthService: jwtService.verify(token)
    AuthService->>Prisma: findUnique(userId)
    Prisma->>PostgreSQL: SELECT * FROM users WHERE id = ?
    PostgreSQL-->>Prisma: user found
    AuthService->>AuthService: generateTokens(user)
    AuthService-->>API: { accessToken, refreshToken }
    API-->>Client: 200 OK + new tokens
```

### Architecture des Guards

```mermaid
graph TD
    A[Client Request] --> B{Route publique?}
    B -->|Oui @Public| C[Skip authentification]
    B -->|Non| D[JwtAuthGuard]
    D --> E{Token valide?}
    E -->|Non| F[401 Unauthorized]
    E -->|Oui| G[JwtStrategy.validate]
    G --> H{User actif?}
    H -->|Non| F
    H -->|Oui| I[Injecter user dans request]
    I --> J{Rôle requis?}
    J -->|Non| K[Exécuter route]
    J -->|Oui| L[RolesGuard]
    L --> M{Rôle valide?}
    M -->|Non| N[403 Forbidden]
    M -->|Oui| K
    C --> K
```

---

## 📄 Fichiers créés

### Structure complète

```
backend/src/
├── auth/
│   ├── decorators/
│   │   ├── current-user.decorator.ts    # @CurrentUser()
│   │   ├── public.decorator.ts          # @Public()
│   │   └── roles.decorator.ts           # @Roles(...)
│   ├── dto/
│   │   ├── login.dto.ts                 # DTO connexion
│   │   ├── register.dto.ts              # DTO inscription
│   │   └── refresh-token.dto.ts         # DTO refresh
│   ├── guards/
│   │   ├── jwt-auth.guard.ts            # Guard JWT
│   │   └── roles.guard.ts               # Guard rôles
│   ├── strategies/
│   │   └── jwt.strategy.ts              # Stratégie Passport JWT
│   ├── auth.controller.ts               # Routes auth
│   ├── auth.service.ts                  # Logique métier
│   └── auth.module.ts                   # Module NestJS
│
└── prisma/
    ├── prisma.service.ts                # Service Prisma
    └── prisma.module.ts                 # Module Prisma
```

### 1. DTOs (Data Transfer Objects)

#### `login.dto.ts`
```typescript
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

**Rôle :** Valider les données de connexion.

#### `register.dto.ts`
```typescript
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(['ADMIN', 'MANAGER', ...])
  @IsOptional()
  role?: string;
}
```

**Rôle :** Valider les données d'inscription avec validation stricte du mot de passe.

### 2. Service d'authentification

#### `auth.service.ts`

**Méthodes principales :**

```typescript
class AuthService {
  // Inscription
  async register(dto: RegisterDto)

  // Connexion
  async login(dto: LoginDto)

  // Rafraîchir le token
  async refreshTokens(refreshToken: string)

  // Récupérer le profil
  async getProfile(userId: string)

  // Déconnexion
  async logout(userId: string)

  // Privé : générer les tokens
  private async generateTokens(userId, email, role)
}
```

**Sécurité :**
- Hash bcrypt avec 10 rounds de salt
- Vérification que l'utilisateur est actif
- Mise à jour de `lastLoginAt` à chaque connexion

### 3. Stratégie JWT Passport

#### `jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService, prisma) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Récupère l'utilisateur depuis la base
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    // Cet objet sera injecté dans request.user
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      // ...
    };
  }
}
```

**Rôle :** Valider le token JWT et charger l'utilisateur.

### 4. Guards

#### `jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Si la route est marquée @Public(), skip l'authentification
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    // Sinon, vérifier le JWT
    return super.canActivate(context);
  }
}
```

#### `roles.guard.ts`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get(ROLES_KEY, context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.role === role);
  }
}
```

### 5. Décorateurs personnalisés

#### `@Public()`
```typescript
// Marquer une route comme publique
@Public()
@Get('public')
async publicRoute() { ... }
```

#### `@Roles(...)`
```typescript
// Restreindre par rôle
@Roles('ADMIN', 'MANAGER')
@Delete(':id')
async delete() { ... }
```

#### `@CurrentUser()`
```typescript
// Récupérer l'utilisateur connecté
@Get('profile')
async getProfile(@CurrentUser() user: any) {
  return user;
}

// Récupérer un champ spécifique
@Get('id')
async getUserId(@CurrentUser('id') userId: string) {
  return userId;
}
```

### 6. Contrôleur Auth

#### `auth.controller.ts`

**Routes disponibles :**

| Méthode | Route | Protection | Description |
|---------|-------|------------|-------------|
| POST | `/api/auth/register` | Public | Inscription |
| POST | `/api/auth/login` | Public | Connexion |
| POST | `/api/auth/refresh` | Public | Refresh token |
| GET | `/api/auth/me` | JWT | Profil utilisateur |
| POST | `/api/auth/logout` | JWT | Déconnexion |

---

## ⚙️ Comment ça marche ?

### 1. Inscription d'un utilisateur

**Flux :**
```
1. Client envoie email + password + infos
2. Backend vérifie que l'email n'existe pas
3. Hash du mot de passe avec bcrypt (10 rounds)
4. Création de l'utilisateur en base
5. Génération de access token + refresh token
6. Retour des tokens au client
```

**Exemple de requête :**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "alex@example.com",
  "password": "Password123!",
  "firstName": "Alex",
  "lastName": "Dupont",
  "role": "CONTRIBUTOR"
}
```

**Réponse :**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alex@example.com",
    "firstName": "Alex",
    "lastName": "Dupont",
    "role": "CONTRIBUTOR"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFsZXhAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ09OVFJJQlVUT1IiLCJpYXQiOjE2OTYxNzYwMDAsImV4cCI6MTY5NjE3NjkwMH0.abc123...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### 2. Connexion

**Flux :**
```
1. Client envoie email + password
2. Backend cherche l'utilisateur par email
3. Vérifie que l'utilisateur existe et est actif
4. Compare le mot de passe avec bcrypt
5. Met à jour lastLoginAt
6. Génère les tokens
7. Retourne user + tokens
```

**Exemple :**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "alex@example.com",
  "password": "Password123!"
}
```

### 3. Utiliser le token pour les requêtes

**Toutes les requêtes protégées nécessitent le header :**
```http
Authorization: Bearer <accessToken>
```

**Exemple :**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Rafraîchir le token

**Quand l'access token expire (15 min), utiliser le refresh token :**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### 5. Protection des routes par rôle

**Exemple dans un contrôleur :**
```typescript
@Controller('projects')
export class ProjectsController {

  // Route accessible à tous les utilisateurs authentifiés
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() { ... }

  // Route accessible uniquement aux ADMIN et MANAGER
  @Roles('ADMIN', 'MANAGER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) { ... }

  // Route publique (pas d'authentification)
  @Public()
  @Get('public')
  async publicData() { ... }
}
```

---

## 🧪 Tester l'authentification

### Méthode 1 : Swagger UI

1. **Démarrer le backend :**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Ouvrir Swagger :**
   ```
   http://localhost:4000/api/docs
   ```

3. **Tester l'inscription :**
   - Cliquer sur `POST /api/auth/register`
   - Cliquer sur "Try it out"
   - Remplir les champs
   - Cliquer sur "Execute"

4. **Copier l'accessToken**

5. **Authentifier dans Swagger :**
   - Cliquer sur le bouton "Authorize" en haut
   - Coller le token dans le champ
   - Cliquer sur "Authorize"

6. **Tester une route protégée :**
   - Cliquer sur `GET /api/auth/me`
   - Cliquer sur "Try it out"
   - Cliquer sur "Execute"

### Méthode 2 : curl

```bash
# 1. Inscription
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Sauvegarder le token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Tester le profil
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Connexion
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### Méthode 3 : Postman / Insomnia

1. **Importer la collection Swagger :**
   ```
   http://localhost:4000/api/docs-json
   ```

2. **Créer une variable d'environnement :**
   - Nom : `accessToken`
   - Valeur : `<votre-token>`

3. **Configurer l'authentification :**
   - Type : Bearer Token
   - Token : `{{accessToken}}`

### Script de test complet

```bash
#!/bin/bash

API_URL="http://localhost:4000/api"

echo "🧪 Test 1: Inscription"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "$REGISTER_RESPONSE" | jq .

ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
echo "✅ Token obtenu: ${ACCESS_TOKEN:0:20}..."

echo ""
echo "🧪 Test 2: Récupération du profil"
curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo ""
echo "🧪 Test 3: Connexion"
curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }' | jq .

echo ""
echo "✅ Tests terminés!"
```

---

## 🔒 Sécurité

### Mesures de sécurité implémentées

1. **Hash des mots de passe**
   - Algorithme : bcrypt
   - Rounds : 10 (compromis perf/sécurité)
   - Jamais de stockage en clair

2. **Tokens JWT**
   - Access token : 15 minutes (courte durée)
   - Refresh token : 30 jours (révocable)
   - Signature HMAC SHA256

3. **Validation stricte**
   - Mot de passe : min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
   - Email : validation format
   - Rôles : enum stricte

4. **Protection des routes**
   - Guards JWT pour l'authentification
   - Guards Roles pour les permissions
   - Vérification de l'état actif de l'utilisateur

5. **Bonnes pratiques**
   - Pas de stack trace en production
   - Messages d'erreur génériques ("Email ou mot de passe incorrect")
   - Rate limiting (TODO: Phase 2)
   - HTTPS obligatoire en production

### Variables d'environnement critiques

```env
# ⚠️ À CHANGER EN PRODUCTION
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Générer un secret fort :
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Améliorations futures (Phase 2+)

- [ ] Rate limiting (express-rate-limit)
- [ ] Refresh token rotation
- [ ] Stockage des refresh tokens en base
- [ ] Révocation des tokens
- [ ] Double authentification (2FA)
- [ ] Logs d'audit des connexions
- [ ] Détection d'activité suspecte
- [ ] Récupération de mot de passe (email)
- [ ] Vérification d'email

---

## 📊 Comparaison Firebase vs JWT personnalisé

| Critère | Firebase Auth | JWT personnalisé |
|---------|---------------|------------------|
| **Coût** | 💰 Payant après 10k users | ✅ Gratuit |
| **Contrôle** | ❌ Limité | ✅ Total |
| **Souveraineté** | ❌ Données chez Google | ✅ Données chez toi |
| **Personnalisation** | ⚠️ Limitée | ✅ Complète |
| **Open-source** | ❌ Non | ✅ Oui |
| **Migration** | ❌ Vendor lock-in | ✅ Portable |
| **Performance** | ⚠️ Dépend de Google | ✅ Contrôlée |

---

## 🎯 Prochaines étapes

### Phase 2 : Modules métier (Semaines 3-6)

Maintenant que l'authentification est en place, on va créer les modules métier :

1. **UsersModule**
   - CRUD utilisateurs
   - Gestion des départements
   - Upload d'avatar (MinIO)

2. **ProjectsModule**
   - CRUD projets
   - Gestion des membres
   - Permissions

3. **TasksModule**
   - CRUD tâches
   - Assignation
   - Dépendances

4. **DocumentsModule**
   - Upload vers MinIO
   - Génération d'URLs signées
   - Permissions

5. **NotificationsModule**
   - WebSocket pour le temps réel
   - Redis Pub/Sub

### Tests à ajouter

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  it('should hash password before saving', async () => {
    const dto = { email: 'test@example.com', password: 'Password123!' };
    const result = await authService.register(dto);
    expect(result.user.passwordHash).not.toBe('Password123!');
  });

  it('should throw on invalid credentials', async () => {
    const dto = { email: 'test@example.com', password: 'WrongPassword' };
    await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('should generate valid JWT tokens', async () => {
    const tokens = await authService.generateTokens('userId', 'email', 'ADMIN');
    const decoded = jwtService.verify(tokens.accessToken);
    expect(decoded.sub).toBe('userId');
    expect(decoded.role).toBe('ADMIN');
  });
});
```

---

## ✅ Checklist Phase 1

- [x] Module d'authentification créé
- [x] DTOs avec validation
- [x] Service d'authentification (register, login, refresh)
- [x] Stratégie JWT Passport
- [x] Guards (JWT, Roles)
- [x] Décorateurs (@Public, @Roles, @CurrentUser)
- [x] Contrôleur avec routes
- [x] Service Prisma
- [x] Documentation Swagger
- [ ] Tests unitaires
- [ ] Tests e2e
- [ ] Documentation utilisateur

---

**Phase 1 terminée ! 🎉**

*Prochaine étape : Phase 2 - Modules métier*

---

*Document créé le 11 octobre 2025*
*Pour le projet Orchestr'A - Migration Open-Source*
