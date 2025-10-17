# 📚 EXPLICATIONS PHASE 0 - Guide Pédagogique pour Débutants

> **Pour qui ?** Ce document est écrit pour quelqu'un qui débute et veut comprendre ce qui a été mis en place.
> **Objectif :** Comprendre chaque fichier, chaque technologie, et pourquoi ils existent.

---

## 🎯 Table des Matières

1. [Vue d'ensemble : Qu'est-ce que la Phase 0 ?](#vue-densemble)
2. [Architecture : Comment tout s'organise ?](#architecture)
3. [Technologies : Qu'est-ce qu'on utilise et pourquoi ?](#technologies)
4. [Fichiers créés : À quoi sert chaque fichier ?](#fichiers-créés)
5. [Concepts importants expliqués simplement](#concepts-importants)
6. [Comment utiliser ce qui a été créé ?](#comment-utiliser)
7. [Prochaines étapes](#prochaines-étapes)

---

## 🎓 Vue d'ensemble : Qu'est-ce que la Phase 0 ?

### Qu'avons-nous fait ?

La **Phase 0** est la phase de **préparation et d'initialisation** du projet. C'est comme préparer les fondations d'une maison avant de la construire.

**Analogie simple :**
- Imagine que tu veux construire une maison (ton application)
- Phase 0 = préparer le terrain, poser les fondations, installer les canalisations
- Les phases suivantes = construire les murs, le toit, décorer

### Pourquoi c'est important ?

Avant de migrer ton application depuis Firebase, il faut :
1. ✅ Créer la structure du projet
2. ✅ Configurer les outils de développement
3. ✅ Mettre en place la base de données
4. ✅ Préparer l'environnement de développement
5. ✅ Créer les pipelines d'automatisation

**Sans cette phase, ce serait comme essayer de déménager sans avoir préparé ton nouveau logement !**

---

## 🏗️ Architecture : Comment tout s'organise ?

### Structure du projet

```
orchestr-a-docker/
│
├── 📁 backend/              ← Le cerveau de l'application (API)
│   ├── src/                 ← Code source TypeScript
│   ├── prisma/              ← Schéma de base de données
│   ├── test/                ← Tests automatisés
│   ├── package.json         ← Liste des dépendances
│   ├── Dockerfile           ← Instructions pour Docker
│   └── README.md            ← Documentation backend
│
├── 📁 .github/              ← Automatisation GitHub
│   └── workflows/
│       └── ci.yml           ← Pipeline CI/CD
│
├── 📄 docker-compose.dev.yml ← Configuration services dev
│
└── 📄 EXPLICATIONS_PHASE_0.md ← Ce fichier !
```

### Qu'est-ce qu'un backend ?

**Backend** = la partie "invisible" de l'application qui :
- Reçoit les demandes des utilisateurs (via l'interface web)
- Traite les données (calculs, logique métier)
- Communique avec la base de données
- Renvoie les résultats

**Analogie :** C'est comme la cuisine d'un restaurant :
- Le client (frontend) commande un plat
- La cuisine (backend) prépare le plat
- Le serveur (API) apporte le plat au client

---

## 🛠️ Technologies : Qu'est-ce qu'on utilise et pourquoi ?

### 1. **NestJS** - Le framework backend

#### C'est quoi ?
NestJS est un framework pour créer des serveurs backend en TypeScript.

#### Pourquoi NestJS ?
- ✅ **TypeScript natif** : détection d'erreurs avant l'exécution
- ✅ **Architecture modulaire** : code organisé en modules réutilisables
- ✅ **Décorateurs** : syntaxe élégante et lisible
- ✅ **Documentation auto-générée** : Swagger/OpenAPI inclus

#### Exemple concret

```typescript
// Un contrôleur NestJS (= un ensemble de routes API)
@Controller('users')
export class UsersController {

  // Route GET /api/users
  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }

  // Route POST /api/users
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

**Ce que tu vois ici :**
- `@Controller('users')` : dit à NestJS "ce fichier gère les routes `/users`"
- `@Get()` : dit "cette fonction répond aux requêtes GET"
- `@Post()` : dit "cette fonction répond aux requêtes POST"
- `@Body()` : dit "récupère les données du corps de la requête"

**Pourquoi c'est bien ?**
- Le code est **auto-documenté** : on comprend en lisant
- TypeScript **vérifie les types** : moins d'erreurs
- Architecture **scalable** : facile d'ajouter de nouvelles fonctionnalités

---

### 2. **Prisma** - L'ORM pour la base de données

#### C'est quoi un ORM ?

**ORM** = Object-Relational Mapping = "Traducteur entre ton code et la base de données"

**Sans ORM** (SQL brut) :
```sql
SELECT * FROM users WHERE email = 'alex@example.com';
```

**Avec Prisma** (TypeScript) :
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'alex@example.com' }
});
```

#### Pourquoi Prisma ?
- ✅ **Type-safe** : ton éditeur connait les champs de ta base
- ✅ **Auto-complétion** : pas besoin de retenir les noms de colonnes
- ✅ **Migrations** : gérer l'évolution du schéma facilement
- ✅ **Prisma Studio** : interface graphique pour explorer tes données

#### Le fichier schema.prisma

C'est le **plan de ta base de données**. Exemple :

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String
  lastName  String
  role      Role     @default(CONTRIBUTOR)

  // Relations
  projects  ProjectMember[]
  tasks     Task[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")  // Nom de la table en base
}
```

**Explication ligne par ligne :**
- `model User` : définit une table "users"
- `id String @id` : colonne ID, type texte, clé primaire
- `@default(uuid())` : génère automatiquement un UUID
- `@unique` : cette valeur doit être unique (pas de doublons)
- `projects ProjectMember[]` : relation avec la table ProjectMember
- `@@map("users")` : le nom de la table en base de données

**Avantage :** Change ce fichier, lance `npx prisma migrate dev`, et ta base est mise à jour automatiquement !

---

### 3. **PostgreSQL** - La base de données

#### C'est quoi ?
PostgreSQL est une base de données **relationnelle** open-source.

#### Pourquoi PostgreSQL ?
- ✅ **Open-source** : gratuit, code ouvert
- ✅ **Robuste** : utilisé par les plus grandes entreprises
- ✅ **JSONB** : peut stocker du JSON (flexibilité)
- ✅ **Extensions** : plein de fonctionnalités additionnelles
- ✅ **ACID** : garantit la cohérence des données

#### Relationnel vs NoSQL

**Firebase Firestore (NoSQL) :**
```javascript
// Document imbriqué
{
  id: "user123",
  name: "Alex",
  projects: [
    { id: "p1", name: "Project A" },
    { id: "p2", name: "Project B" }
  ]
}
```

**PostgreSQL (Relationnel) :**
```
Table users:
| id      | name |
|---------|------|
| user123 | Alex |

Table projects:
| id | name      | user_id |
|----|-----------|---------|
| p1 | Project A | user123 |
| p2 | Project B | user123 |
```

**Avantages du relationnel :**
- Pas de duplication de données
- Requêtes complexes facilitées (jointures)
- Intégrité référentielle garantie

---

### 4. **Redis** - Cache et sessions

#### C'est quoi ?
Redis est une base de données **en mémoire** ultra-rapide.

#### À quoi ça sert ?

**1. Cache :**
```typescript
// Sans cache : requête base de données = lent
const projects = await prisma.project.findMany(); // 50ms

// Avec cache : lecture mémoire = ultra-rapide
const cached = await redis.get('projects'); // 1ms
if (!cached) {
  const projects = await prisma.project.findMany();
  await redis.set('projects', JSON.stringify(projects), 'EX', 300); // Cache 5min
}
```

**2. Pub/Sub (Notifications temps réel) :**
```typescript
// Serveur 1 : publie un événement
await redis.publish('notifications', JSON.stringify({
  userId: 'user123',
  message: 'Nouvelle tâche assignée'
}));

// Serveur 2 : reçoit l'événement en temps réel
redis.subscribe('notifications', (message) => {
  const data = JSON.parse(message);
  io.to(data.userId).emit('notification', data);
});
```

**Pourquoi c'est important ?**
- **Cache** : accélère l'application (x50 plus rapide)
- **Pub/Sub** : notifications instantanées entre serveurs
- **Sessions** : stocke les sessions utilisateur

---

### 5. **MinIO** - Stockage de fichiers

#### C'est quoi ?
MinIO est un serveur de stockage d'objets **compatible S3** (comme AWS S3, mais open-source).

#### Pourquoi MinIO ?
- ✅ **Compatible S3** : même API qu'Amazon S3
- ✅ **Open-source** : auto-hébergeable
- ✅ **Performant** : conçu pour le cloud-native
- ✅ **Interface web** : console d'administration

#### Comment ça marche ?

```typescript
// Upload d'un fichier
await minioClient.putObject(
  'documents',           // Bucket (= dossier)
  'project-1/report.pdf', // Nom du fichier
  fileBuffer,            // Contenu du fichier
  fileSize
);

// Génération d'URL de téléchargement (expire en 1h)
const url = await minioClient.presignedGetObject(
  'documents',
  'project-1/report.pdf',
  3600 // 1 heure
);
```

**Analogie :** MinIO est comme un disque dur réseau où tu peux :
- Uploader des fichiers
- Organiser en dossiers (buckets)
- Générer des liens de téléchargement temporaires
- Gérer les permissions

---

### 6. **Docker & Docker Compose**

#### C'est quoi Docker ?

**Docker** = technologie pour empaqueter une application avec toutes ses dépendances.

**Analogie :** Un conteneur Docker est comme un conteneur de transport :
- Tout est à l'intérieur (application + dépendances)
- S'exécute pareil partout (dev, staging, production)
- Isolé des autres conteneurs

#### C'est quoi Docker Compose ?

**Docker Compose** = orchestrateur de conteneurs.

Au lieu de lancer manuellement :
```bash
docker run postgres
docker run redis
docker run minio
docker run backend
```

Tu lances **une seule commande** :
```bash
docker-compose -f docker-compose.dev.yml up -d
```

Et Docker Compose démarre automatiquement **tous les services** définis !

#### Le fichier docker-compose.dev.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine    # Image officielle PostgreSQL
    container_name: orchestr-a-postgres-dev
    environment:
      POSTGRES_DB: orchestra_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"  # Port exposé sur ton PC
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data  # Persistance
    networks:
      - orchestr-a-dev  # Réseau isolé
```

**Explication :**
- `image` : quelle image Docker utiliser (PostgreSQL version 16)
- `environment` : variables d'environnement (config)
- `ports` : `5432:5432` = "redirige le port 5432 du conteneur vers le port 5432 de ton PC"
- `volumes` : sauvegarde les données même si le conteneur est supprimé
- `networks` : réseau privé pour que les conteneurs communiquent entre eux

**Avantage :**
- Démarrage en une commande
- Configuration reproductible
- Isolation complète
- Pas de pollution de ton système

---

### 7. **TypeScript**

#### C'est quoi ?
**TypeScript** = JavaScript avec des types.

#### Comparaison

**JavaScript (sans types) :**
```javascript
function addUser(user) {
  return database.insert(user);
}

addUser({ nam: 'Alex' }); // Typo ! Mais pas d'erreur jusqu'à l'exécution
```

**TypeScript (avec types) :**
```typescript
interface User {
  name: string;
  email: string;
}

function addUser(user: User) {
  return database.insert(user);
}

addUser({ nam: 'Alex' }); // ❌ Erreur détectée immédiatement !
// Property 'name' is missing in type '{ nam: string; }'
```

**Avantages :**
- ✅ Détection d'erreurs **avant l'exécution**
- ✅ Auto-complétion dans l'éditeur
- ✅ Refactoring facilité
- ✅ Code auto-documenté

---

## 📄 Fichiers créés : À quoi sert chaque fichier ?

### 1. `backend/src/main.ts`

**Rôle :** Point d'entrée de l'application (le fichier qui démarre tout).

**Contenu expliqué :**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // 1. Créer l'application NestJS
  const app = await NestFactory.create(AppModule);

  // 2. Configurer le préfixe des routes (/api)
  app.setGlobalPrefix('api');
  // Résultat : toutes les routes commencent par /api
  // Exemple : /api/users, /api/projects

  // 3. Activer CORS (permet au frontend de communiquer)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // 4. Activer la validation automatique des données
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,      // Retire les propriétés non définies
    forbidNonWhitelisted: true, // Rejette si propriétés inconnues
    transform: true,      // Transforme les types automatiquement
  }));

  // 5. Configurer Swagger (documentation API automatique)
  const config = new DocumentBuilder()
    .setTitle("Orchestr'A API")
    .setDescription('API REST pour la plateforme de gestion de projets')
    .setVersion('1.0')
    .addBearerAuth() // Supporte l'authentification JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  // Résultat : documentation accessible sur http://localhost:4000/api/docs

  // 6. Démarrer le serveur sur le port 4000
  await app.listen(4000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
```

**Ce que tu dois retenir :**
- Ce fichier démarre l'application
- Configure la validation, CORS, documentation
- L'API est accessible sur `http://localhost:4000/api`

---

### 2. `backend/src/app.module.ts`

**Rôle :** Module racine qui importe tous les autres modules.

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Charge les variables d'environnement depuis .env
    ConfigModule.forRoot({
      isGlobal: true, // Accessible partout
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Architecture NestJS en modules :**

```
AppModule (racine)
├── AuthModule          (authentification)
│   ├── AuthController
│   ├── AuthService
│   └── JwtStrategy
│
├── UsersModule         (gestion utilisateurs)
│   ├── UsersController
│   └── UsersService
│
└── ProjectsModule      (gestion projets)
    ├── ProjectsController
    └── ProjectsService
```

**Avantage :** Chaque fonctionnalité est isolée dans son module.

---

### 3. `backend/src/app.controller.ts`

**Rôle :** Contrôleur de base (health check).

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

**Utilité :** Route `GET /api/health` pour vérifier que l'API fonctionne.

**Exemple de requête :**
```bash
curl http://localhost:4000/api/health
```

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2025-10-11T14:30:00.000Z",
  "uptime": 3600
}
```

---

### 4. `backend/prisma/schema.prisma`

**Rôle :** Définit le schéma de la base de données.

**Extrait commenté :**

```prisma
// Configuration du générateur Prisma
generator client {
  provider = "prisma-client-js"
}

// Configuration de la connexion base de données
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Lit depuis la variable d'environnement
}

// Énumération des rôles possibles
enum Role {
  ADMIN
  RESPONSABLE
  MANAGER
  TEAM_LEAD
  CONTRIBUTOR
  VIEWER
}

// Modèle User (= table users)
model User {
  id            String    @id @default(uuid())  // ID unique généré automatiquement
  email         String    @unique                // Email unique
  passwordHash  String    @map("password_hash")  // Mot de passe hashé
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  role          Role      @default(CONTRIBUTOR)  // Rôle par défaut
  isActive      Boolean   @default(true)

  // Relation : un user appartient à un department
  departmentId  String?   @map("department_id")
  department    Department? @relation(fields: [departmentId], references: [id])

  // Timestamps automatiques
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  // Relations inversées (un user a plusieurs tasks, projects, etc.)
  tasks         Task[]
  projects      ProjectMember[]
  comments      Comment[]
  leaves        Leave[]

  @@map("users")  // Nom de la table en base
  @@index([email])  // Index pour accélérer les recherches par email
}
```

**Concepts importants :**

1. **Relations One-to-Many :**
```prisma
// Un user a plusieurs tasks
model User {
  tasks Task[]
}

model Task {
  assigneeId String
  assignee   User @relation(fields: [assigneeId], references: [id])
}
```

2. **Relations Many-to-Many :**
```prisma
// Un user peut être dans plusieurs projects
// Un project peut avoir plusieurs users
model ProjectMember {
  projectId String
  userId    String
  project   Project @relation(...)
  user      User    @relation(...)

  @@unique([projectId, userId])  // Pas de doublons
}
```

3. **Types spéciaux :**
- `@default(uuid())` : génère un ID unique
- `@default(now())` : date/heure actuelle
- `@updatedAt` : se met à jour automatiquement
- `@unique` : valeur unique (pas de doublons)
- `@db.Text` : texte long (pas de limite)
- `Json` : données JSON flexibles

---

### 5. `docker-compose.dev.yml`

**Rôle :** Configure l'environnement de développement.

**Sections expliquées :**

```yaml
version: '3.8'  # Version du format Docker Compose

services:
  # Service PostgreSQL
  postgres:
    image: postgres:16-alpine  # Image officielle légère
    container_name: orchestr-a-postgres-dev
    restart: unless-stopped    # Redémarre automatiquement si crash
    environment:
      POSTGRES_DB: orchestra_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"  # Format : PORT_HOTE:PORT_CONTENEUR
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data  # Persistance
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev -d orchestra_dev"]
      interval: 10s   # Vérifie toutes les 10 secondes
      timeout: 5s
      retries: 5
    networks:
      - orchestr-a-dev

  # Service Redis
  redis:
    image: redis:7-alpine
    container_name: orchestr-a-redis-dev
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-dev-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - orchestr-a-dev

  # Service MinIO
  minio:
    image: minio/minio:latest
    container_name: orchestr-a-minio-dev
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: devuser
      MINIO_ROOT_PASSWORD: devpassword
    ports:
      - "9000:9000"  # API S3
      - "9001:9001"  # Console Web
    volumes:
      - minio-dev-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - orchestr-a-dev

# Volumes nommés (persistance des données)
volumes:
  postgres-dev-data:
    driver: local
  redis-dev-data:
    driver: local
  minio-dev-data:
    driver: local

# Réseau privé pour l'isolation
networks:
  orchestr-a-dev:
    driver: bridge
```

**Concepts clés :**

1. **Ports :** `HOST:CONTAINER`
   - `5432:5432` = port 5432 du conteneur accessible sur port 5432 de ton PC

2. **Volumes :**
   - Sauvegarde les données hors du conteneur
   - Si tu supprimes le conteneur, les données restent

3. **Networks :**
   - Réseau isolé pour que les conteneurs communiquent
   - Les conteneurs se voient par leur nom (`postgres`, `redis`, `minio`)

4. **Healthcheck :**
   - Vérifie que le service fonctionne
   - Docker Compose attend que le healthcheck soit OK avant de démarrer les services dépendants

---

### 6. `.github/workflows/ci.yml`

**Rôle :** Pipeline CI/CD automatique sur GitHub.

**Qu'est-ce qu'un pipeline CI/CD ?**

**CI** = Continuous Integration (Intégration Continue)
**CD** = Continuous Deployment (Déploiement Continu)

**Concrètement :**
- À chaque `git push` sur GitHub
- GitHub Actions exécute automatiquement :
  1. Tests de qualité du code (lint)
  2. Vérification des types TypeScript
  3. Exécution des tests unitaires
  4. Build de l'image Docker
  5. Déploiement (si branche `main`)

**Flux visualisé :**

```
git push
   ↓
GitHub Actions démarre
   ↓
Job 1: Lint & Type Check (2-3 min)
   ├── npm ci (install dependencies)
   ├── npm run lint:check
   └── npx tsc --noEmit
   ↓
Job 2: Tests unitaires (3-5 min)
   ├── npm ci
   ├── npm test -- --coverage
   └── Upload coverage to Codecov
   ↓
Job 3: Build Docker Image (5-10 min)
   ├── Docker Build
   ├── Push to GitHub Container Registry
   └── Tag: latest + SHA
   ↓
✅ Success !
```

**Extrait commenté :**

```yaml
name: CI/CD Pipeline

# Déclencheurs : quand exécuter ce pipeline ?
on:
  push:
    branches: [main, master, develop]  # À chaque push sur ces branches
  pull_request:
    branches: [main, master]  # À chaque pull request

jobs:
  # Job 1 : Lint et vérification types
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest  # Machine virtuelle Ubuntu

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4  # Télécharge le code du repo

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'  # Cache pour accélérer
          cache-dependency-path: backend/package-lock.json

      - name: 📦 Install dependencies
        working-directory: ./backend
        run: npm ci  # Install depuis package-lock.json (reproductible)

      - name: 🔍 Run ESLint
        working-directory: ./backend
        run: npm run lint:check

      - name: 📝 TypeScript Type Check
        working-directory: ./backend
        run: npx tsc --noEmit  # Vérifie les types sans compiler

  # Job 2 : Tests unitaires (dépend de lint)
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint  # Attend que lint soit terminé avec succès

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 📦 Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: 🧪 Run tests
        working-directory: ./backend
        run: npm test -- --coverage

      - name: 📊 Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
          name: backend-coverage

  # Job 3 : Build Docker (seulement sur main/master)
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [lint, test]  # Attend que lint ET test soient OK
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master')

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🐳 Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 🔐 Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 🏗️ Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/orchestr-a-backend:latest
            ghcr.io/${{ github.repository }}/orchestr-a-backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Avantages :**
- ✅ Détection immédiate des erreurs
- ✅ Pas de régression (tests automatiques)
- ✅ Image Docker prête à déployer
- ✅ Historique complet des builds
- ✅ Notification en cas d'échec

---

### 7. `backend/Dockerfile`

**Rôle :** Instructions pour construire l'image Docker de production.

**Multi-stage build expliqué :**

```dockerfile
# ==========================================
# STAGE 1 : BUILD (compilation TypeScript)
# ==========================================
FROM node:18-alpine AS builder

# Répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (dev incluses pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma (librairie auto-générée)
RUN npx prisma generate

# Compiler TypeScript → JavaScript
RUN npm run build
# Résultat : dossier /app/dist avec le code compilé

# ==========================================
# STAGE 2 : PRODUCTION (image finale légère)
# ==========================================
FROM node:18-alpine

WORKDIR /app

# Installer SEULEMENT les dépendances de production
COPY package*.json ./
RUN npm ci --only=production

# Copier le code compilé depuis le stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Exposer le port 4000
EXPOSE 4000

# Variable d'environnement
ENV NODE_ENV=production

# Commande de démarrage
CMD ["node", "dist/main"]
```

**Pourquoi multi-stage ?**

**Sans multi-stage (image lourde) :**
- Image finale = 1,2 GB
- Contient : code source + dépendances dev + build tools

**Avec multi-stage (image légère) :**
- Image finale = 250 MB
- Contient : seulement le code compilé + dépendances prod

**Avantage :**
- ✅ Image 5x plus petite
- ✅ Déploiement plus rapide
- ✅ Moins de surface d'attaque (sécurité)

---

### 8. `backend/package.json`

**Rôle :** Manifeste du projet (dépendances, scripts, métadonnées).

**Sections importantes :**

```json
{
  "name": "orchestr-a-backend",
  "version": "1.0.0",
  "description": "Backend API pour Orchestr'A",

  "scripts": {
    "start": "node dist/main",                // Production
    "start:dev": "nest start --watch",        // Dev avec hot-reload
    "start:debug": "nest start --debug --watch", // Debug
    "build": "nest build",                    // Compile TypeScript
    "test": "jest",                           // Tests unitaires
    "test:watch": "jest --watch",             // Tests en mode watch
    "test:cov": "jest --coverage",            // Tests avec coverage
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "lint:check": "eslint \"{src,apps,libs,test}/**/*.ts\""
  },

  "dependencies": {
    "@nestjs/common": "^10.3.0",       // Core NestJS
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",          // Gestion JWT
    "@nestjs/passport": "^10.0.3",     // Stratégies auth
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/swagger": "^7.2.0",       // Documentation API
    "@prisma/client": "^5.8.0",        // Client Prisma
    "bcrypt": "^5.1.1",                // Hash mots de passe
    "class-transformer": "^0.5.1",     // Transformation objets
    "class-validator": "^0.14.1",      // Validation DTO
    "ioredis": "^5.3.2",               // Client Redis
    "minio": "^7.1.3",                 // Client MinIO (S3)
    "passport": "^0.7.0",              // Auth middleware
    "passport-jwt": "^4.0.1",          // Stratégie JWT
    "rxjs": "^7.8.1",                  // Reactive programming
    "reflect-metadata": "^0.2.1",      // Métadonnées TypeScript
    "uuid": "^9.0.1"                   // Génération UUID
  },

  "devDependencies": {
    "@nestjs/cli": "^10.3.0",          // CLI NestJS
    "@nestjs/testing": "^10.3.0",      // Outils tests
    "@types/bcrypt": "^5.0.2",         // Types TypeScript
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.11.0",
    "@types/passport-jwt": "^4.0.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",               // Linter
    "jest": "^29.7.0",                 // Framework tests
    "prettier": "^3.2.4",              // Formateur code
    "prisma": "^5.8.0",                // CLI Prisma
    "ts-jest": "^29.1.1",              // Jest pour TypeScript
    "ts-node": "^10.9.2",              // Exécute TS directement
    "typescript": "^5.3.3"             // Compilateur TypeScript
  }
}
```

**Différence dependencies vs devDependencies :**

- **dependencies** : nécessaires en production
  - Exemple : `@nestjs/core`, `@prisma/client`

- **devDependencies** : seulement pour le développement
  - Exemple : `@types/*`, `eslint`, `jest`

**Commandes utiles :**
```bash
npm install          # Installe tout
npm ci               # Install depuis lock file (reproductible)
npm install --only=production  # Installe seulement dependencies
```

---

### 9. `backend/.env.example`

**Rôle :** Template des variables d'environnement.

```env
# ==================================
# APPLICATION
# ==================================
NODE_ENV=development
PORT=4000
API_PREFIX=api

# ==================================
# BASE DE DONNÉES
# ==================================
DATABASE_URL="postgresql://dev:devpassword@localhost:5432/orchestra_dev?schema=public"

# Explication :
# postgresql://    ← Type de base de données
# dev              ← Utilisateur
# :devpassword     ← Mot de passe
# @localhost:5432  ← Hôte et port
# /orchestra_dev   ← Nom de la base
# ?schema=public   ← Schéma par défaut

# ==================================
# JWT (JSON Web Tokens)
# ==================================
JWT_SECRET=votre-secret-super-securise-ici-changez-moi
JWT_ACCESS_EXPIRATION=15m    # Token d'accès expire en 15 minutes
JWT_REFRESH_EXPIRATION=30d   # Token de refresh expire en 30 jours

# ==================================
# REDIS
# ==================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Vide en dev

# ==================================
# MINIO (S3)
# ==================================
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=devuser
MINIO_SECRET_KEY=devpassword
MINIO_BUCKET_DOCUMENTS=documents
MINIO_BUCKET_AVATARS=avatars

# ==================================
# CORS
# ==================================
CORS_ORIGIN=http://localhost:3000  # URL du frontend

# ==================================
# LOGS
# ==================================
LOG_LEVEL=debug  # debug, info, warn, error
```

**Pourquoi .env.example et pas .env ?**
- `.env` contient les vraies valeurs (secrets) → **jamais commit dans Git**
- `.env.example` est un template → commit dans Git pour documentation

**Utilisation :**
```bash
cp .env.example .env
nano .env  # Éditer et remplir les vraies valeurs
```

---

### 10. `backend/README.md`

**Rôle :** Documentation du backend (installation, utilisation).

**Contient :**
- Instructions d'installation
- Commandes disponibles
- URLs importantes
- Architecture du projet
- Guide de démarrage rapide

**À quoi ça sert ?**
- Nouveau développeur arrive → lit le README → peut démarrer en 10 minutes
- Tu reviens sur le projet après 6 mois → README te rafraîchit la mémoire

---

## 🎓 Concepts importants expliqués simplement

### 1. API REST

**REST** = Representational State Transfer

**C'est quoi ?** Un style d'architecture pour créer des APIs web.

**Principes :**

1. **Ressources** : tout est une "ressource" (user, project, task)
2. **URLs** : chaque ressource a une URL unique
3. **Verbes HTTP** : actions standardisées (GET, POST, PUT, DELETE)
4. **Sans état** : chaque requête est indépendante

**Exemple :**

```
GET    /api/users          → Liste tous les users
GET    /api/users/123      → Récupère le user 123
POST   /api/users          → Crée un nouveau user
PUT    /api/users/123      → Modifie le user 123
DELETE /api/users/123      → Supprime le user 123
```

**Requête HTTP :**
```http
POST /api/users HTTP/1.1
Host: localhost:4000
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "email": "alex@example.com",
  "firstName": "Alex",
  "lastName": "Dupont"
}
```

**Réponse HTTP :**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alex@example.com",
  "firstName": "Alex",
  "lastName": "Dupont",
  "createdAt": "2025-10-11T14:30:00Z"
}
```

---

### 2. JWT (JSON Web Tokens)

**C'est quoi ?** Un token d'authentification sécurisé.

**Problème à résoudre :**
- Firebase utilisait des sessions
- Pour une API REST, on préfère des tokens stateless (sans état)

**Comment ça marche ?**

1. **Login :**
```
Client → POST /api/auth/login { email, password }
Server → Vérifie les credentials
Server → Génère un JWT
Server → Renvoie le JWT au client
```

2. **Requêtes suivantes :**
```
Client → GET /api/projects
         Header: Authorization: Bearer <JWT>
Server → Vérifie le JWT
Server → Si valide, exécute la requête
```

**Structure d'un JWT :**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNjk2MTc2MDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

# Décodé :
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "user123", "role": "ADMIN", "iat": 1696176000 }
Signature: HMACSHA256(header + payload, secret)
```

**Avantages :**
- ✅ Stateless (pas de session en base)
- ✅ Scalable (plusieurs serveurs possibles)
- ✅ Contient des infos (rôle, ID, etc.)
- ✅ Sécurisé (signature cryptographique)

**Exemple NestJS :**

```typescript
// Génération du token
const payload = { sub: user.id, email: user.email, role: user.role };
const accessToken = this.jwtService.sign(payload, {
  expiresIn: '15m',
});

// Vérification du token (automatique via Guard)
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user; // Le guard a décodé le JWT et injecté l'user
}
```

---

### 3. Migrations de base de données

**C'est quoi ?** Un système de versioning pour la base de données.

**Problème :**
- Tu modifies le schéma Prisma
- Comment appliquer les changements à la base ?
- Comment garder un historique ?

**Solution : Migrations Prisma**

**Workflow :**

1. **Modifier schema.prisma :**
```prisma
model User {
  id    String @id
  email String @unique
  // ➕ Ajout d'un champ
  phone String?
}
```

2. **Créer une migration :**
```bash
npx prisma migrate dev --name add_phone_to_user
```

3. **Prisma génère :**
```sql
-- migrations/20251011143000_add_phone_to_user/migration.sql
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
```

4. **Applique automatiquement** à la base de données

**Historique des migrations :**
```
migrations/
├── 20251001120000_init/
│   └── migration.sql
├── 20251005143000_add_departments/
│   └── migration.sql
└── 20251011143000_add_phone_to_user/
    └── migration.sql
```

**Avantages :**
- ✅ Historique complet des changements
- ✅ Reproductible (même schéma partout)
- ✅ Rollback possible
- ✅ Collaboration facilitée (Git)

**Commandes utiles :**
```bash
# Créer et appliquer une migration
npx prisma migrate dev --name my_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser la base (dev only)
npx prisma migrate reset

# Voir le statut des migrations
npx prisma migrate status
```

---

### 4. Dependency Injection

**C'est quoi ?** Un pattern de conception pour gérer les dépendances.

**Sans Dependency Injection :**

```typescript
class UsersController {
  constructor() {
    // ❌ La classe crée elle-même ses dépendances
    this.usersService = new UsersService();
    this.emailService = new EmailService();
  }
}
```

**Problèmes :**
- Difficile à tester (dépendances hardcodées)
- Couplage fort
- Impossible de remplacer les services

**Avec Dependency Injection (NestJS) :**

```typescript
@Injectable()
class UsersService {
  constructor(private prisma: PrismaService) {}
  // PrismaService est injecté automatiquement
}

@Controller('users')
class UsersController {
  constructor(private usersService: UsersService) {}
  // UsersService est injecté automatiquement
}
```

**Avantages :**
- ✅ Facile à tester (on peut injecter des mocks)
- ✅ Couplage faible
- ✅ Réutilisabilité
- ✅ Gestion automatique par NestJS

**Comment ça marche ?**

1. Tu marques une classe avec `@Injectable()`
2. Tu la déclares dans un module
3. NestJS crée automatiquement une instance
4. NestJS l'injecte où c'est nécessaire

**Module NestJS :**
```typescript
@Module({
  providers: [UsersService, PrismaService],  // Services disponibles
  controllers: [UsersController],             // Contrôleurs
})
export class UsersModule {}
```

---

### 5. DTO (Data Transfer Object)

**C'est quoi ?** Une classe qui définit la structure des données.

**Pourquoi ?**
- Valider les données entrantes
- Documenter l'API
- Type-safety

**Exemple :**

```typescript
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: ['ADMIN', 'MANAGER', 'CONTRIBUTOR'] })
  @IsEnum(['ADMIN', 'MANAGER', 'CONTRIBUTOR'])
  role?: string;
}
```

**Utilisation dans un contrôleur :**

```typescript
@Post()
async createUser(@Body() createUserDto: CreateUserDto) {
  // Si les données ne respectent pas le DTO, NestJS rejette automatiquement
  return this.usersService.create(createUserDto);
}
```

**Validation automatique :**

```http
POST /api/users
{
  "email": "invalid-email",  ← Pas un email valide
  "password": "123",         ← Trop court
  "firstName": "Alex"
}

❌ Réponse 400 Bad Request:
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

**Avantages :**
- ✅ Validation automatique
- ✅ Documentation Swagger auto-générée
- ✅ Type-safety
- ✅ Transformation automatique

---

### 6. Guards (Protection des routes)

**C'est quoi ?** Un mécanisme pour protéger les routes.

**Exemple : authentification requise**

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token missing');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload; // Injecte l'user dans la requête
      return true; // Autoriser l'accès
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
```

**Utilisation :**

```typescript
// Protéger une route spécifique
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user;
}

// Protéger un contrôleur entier
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  // Toutes les routes nécessitent l'authentification
}

// Protéger globalement (dans main.ts)
app.useGlobalGuards(new JwtAuthGuard());
```

**Guards pour les rôles :**

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some(role => user.role === role);
  }
}

// Utilisation
@Roles('ADMIN', 'MANAGER')
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
async deleteProject(@Param('id') id: string) {
  return this.projectsService.delete(id);
}
```

---

### 7. Pipes (Transformation et validation)

**C'est quoi ?** Un mécanisme pour transformer et valider les données.

**Types de pipes :**

1. **ValidationPipe** : valide les DTO
2. **ParseIntPipe** : transforme string → number
3. **ParseUUIDPipe** : valide un UUID

**Exemple :**

```typescript
@Get(':id')
async getProject(
  @Param('id', ParseUUIDPipe) id: string  // Valide que c'est un UUID
) {
  return this.projectsService.findOne(id);
}

// Si l'ID n'est pas un UUID :
GET /api/projects/invalid-id
❌ 400 Bad Request: "Validation failed (uuid is expected)"
```

**Pipe global (main.ts) :**

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Retire les propriétés non définies dans le DTO
  forbidNonWhitelisted: true,   // Rejette si propriétés inconnues
  transform: true,              // Transforme automatiquement les types
}));
```

---

### 8. Interceptors (Modification requête/réponse)

**C'est quoi ?** Un mécanisme pour intercepter et modifier les requêtes/réponses.

**Exemples d'usage :**
- Logging
- Transformation de réponse
- Gestion du cache
- Timeout

**Exemple : Logger les requêtes**

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    console.log(`➡️  ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        console.log(`⬅️  ${method} ${url} - ${elapsed}ms`);
      })
    );
  }
}
```

**Exemple : Transformer la réponse**

```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}

// Avant interceptor :
{ "id": "123", "name": "Project A" }

// Après interceptor :
{
  "success": true,
  "data": { "id": "123", "name": "Project A" },
  "timestamp": "2025-10-11T14:30:00Z"
}
```

---

## 🚀 Comment utiliser ce qui a été créé ?

### Étape 1 : Démarrer l'environnement de développement

**Prérequis :**
- Docker Desktop installé
- Node.js 18+ installé
- Git installé

**Commandes :**

```bash
# 1. Se placer dans le dossier backend
cd /home/alex/Documents/Repository/orchestr-a-docker/backend

# 2. Installer les dépendances Node.js
npm install

# 3. Copier le fichier .env
cp .env.example .env

# 4. Éditer .env si nécessaire
nano .env

# 5. Revenir à la racine du projet
cd ..

# 6. Démarrer les services Docker (PostgreSQL, Redis, MinIO)
docker-compose -f docker-compose.dev.yml up -d

# 7. Vérifier que les services sont démarrés
docker-compose -f docker-compose.dev.yml ps
```

**Résultat attendu :**
```
NAME                         IMAGE                 STATUS
orchestr-a-postgres-dev      postgres:16-alpine    Up (healthy)
orchestr-a-redis-dev         redis:7-alpine        Up (healthy)
orchestr-a-minio-dev         minio/minio:latest    Up (healthy)
```

---

### Étape 2 : Créer la base de données

```bash
# Revenir dans le dossier backend
cd backend

# Appliquer les migrations (crée les tables)
npx prisma migrate dev --name init

# (Optionnel) Remplir avec des données de test
npx prisma db seed
```

**Ce qui se passe :**
1. Prisma lit `schema.prisma`
2. Génère le SQL nécessaire
3. Applique les changements à PostgreSQL
4. Génère le client Prisma TypeScript

**Résultat :**
- Tables créées dans PostgreSQL
- Client Prisma généré dans `node_modules/@prisma/client`

---

### Étape 3 : Démarrer le backend

```bash
# Mode développement (hot-reload)
npm run start:dev

# OU mode debug
npm run start:debug
```

**Résultat :**
```
[Nest] 12345  - 10/11/2025, 2:30:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 10/11/2025, 2:30:01 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 10/11/2025, 2:30:01 PM     LOG [RoutesResolver] AppController {/api}:
[Nest] 12345  - 10/11/2025, 2:30:01 PM     LOG [RouterExplorer] Mapped {/api/health, GET} route
[Nest] 12345  - 10/11/2025, 2:30:01 PM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 10/11/2025, 2:30:01 PM     LOG Application is running on: http://localhost:4000
```

---

### Étape 4 : Tester l'API

**Méthode 1 : Swagger UI**

Ouvre ton navigateur :
```
http://localhost:4000/api/docs
```

Tu verras une interface interactive pour tester les routes.

**Méthode 2 : curl**

```bash
# Health check
curl http://localhost:4000/api/health

# Résultat :
{
  "status": "ok",
  "timestamp": "2025-10-11T14:30:00.000Z",
  "uptime": 42
}
```

**Méthode 3 : Postman / Insomnia**

Importe la collection Swagger :
```
http://localhost:4000/api/docs-json
```

---

### Étape 5 : Explorer la base de données

**Méthode 1 : Prisma Studio**

```bash
npx prisma studio
```

Ouvre automatiquement :
```
http://localhost:5555
```

Interface graphique pour :
- Voir les tables
- Éditer les données
- Créer des enregistrements

**Méthode 2 : Client PostgreSQL**

```bash
docker exec -it orchestr-a-postgres-dev psql -U dev -d orchestra_dev
```

Commandes SQL :
```sql
-- Lister les tables
\dt

-- Voir la structure d'une table
\d users

-- Requête SQL
SELECT * FROM users;

-- Quitter
\q
```

---

### Étape 6 : Explorer MinIO

**Console MinIO :**
```
http://localhost:9001
```

**Credentials :**
- Username : `devuser`
- Password : `devpassword`

**Utilisation :**
- Créer des buckets
- Uploader des fichiers
- Gérer les permissions

---

### Étape 7 : Arrêter les services

```bash
# Arrêter les conteneurs Docker
docker-compose -f docker-compose.dev.yml down

# Arrêter ET supprimer les volumes (données perdues)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🧪 Commandes utiles pour le développement

### Backend (NestJS)

```bash
# Démarrage
npm run start:dev          # Dev avec hot-reload
npm run start:debug        # Mode debug (port 9229)
npm run start:prod         # Production

# Build
npm run build              # Compile TypeScript → JavaScript

# Tests
npm test                   # Tests unitaires
npm run test:watch         # Tests en mode watch
npm run test:cov           # Tests avec coverage
npm run test:e2e           # Tests end-to-end

# Linting
npm run lint               # Lint et fix
npm run lint:check         # Lint sans fix

# Type checking
npx tsc --noEmit           # Vérifie les types TypeScript
```

---

### Database (Prisma)

```bash
# Migrations
npx prisma migrate dev --name my_migration  # Créer et appliquer
npx prisma migrate deploy                   # Appliquer en prod
npx prisma migrate reset                    # Réinitialiser (dev)
npx prisma migrate status                   # Statut

# Génération
npx prisma generate                         # Générer le client

# Interface graphique
npx prisma studio                           # Ouvre sur :5555

# Seed (données de test)
npx prisma db seed

# Formatage
npx prisma format                           # Formater schema.prisma
```

---

### Docker

```bash
# Docker Compose
docker-compose -f docker-compose.dev.yml up -d        # Démarrer
docker-compose -f docker-compose.dev.yml down         # Arrêter
docker-compose -f docker-compose.dev.yml ps           # Statut
docker-compose -f docker-compose.dev.yml logs -f      # Logs en temps réel
docker-compose -f docker-compose.dev.yml restart      # Redémarrer

# Conteneurs individuels
docker-compose -f docker-compose.dev.yml up -d postgres  # Seulement PostgreSQL
docker-compose -f docker-compose.dev.yml logs postgres   # Logs PostgreSQL

# Nettoyage
docker-compose -f docker-compose.dev.yml down -v      # Supprimer volumes
docker system prune -a                                # Nettoyer tout Docker

# Inspection
docker exec -it orchestr-a-postgres-dev psql -U dev -d orchestra_dev
docker exec -it orchestr-a-redis-dev redis-cli
```

---

### Git

```bash
# Statut
git status
git log --oneline -10

# Commits
git add .
git commit -m "feat: add user authentication"
git push

# Branches
git checkout -b feature/new-module
git checkout master
git merge feature/new-module

# Pull requests (si GitHub CLI installé)
gh pr create --title "Add user authentication" --body "Description"
```

---

## 📚 Prochaines étapes

### Phase 1 : Authentification (Semaine 1-2)

**Objectif :** Remplacer Firebase Auth par JWT.

**Tâches :**
1. Créer le module `auth/`
   - `auth.controller.ts` : routes login/register/refresh
   - `auth.service.ts` : logique d'authentification
   - `jwt.strategy.ts` : stratégie Passport JWT

2. Créer les Guards
   - `JwtAuthGuard` : vérifier le token
   - `RolesGuard` : vérifier les rôles

3. Créer les DTO
   - `LoginDto`
   - `RegisterDto`
   - `RefreshTokenDto`

4. Implémenter le hash de mots de passe (bcrypt)

5. Tests unitaires

**Résultat attendu :**
```typescript
// Routes disponibles
POST /api/auth/register     { email, password, firstName, lastName }
POST /api/auth/login        { email, password }
POST /api/auth/refresh      { refreshToken }
GET  /api/auth/me           (nécessite JWT)
POST /api/auth/logout       (nécessite JWT)
```

---

### Phase 2 : Modules métier (Semaine 3-6)

**Objectif :** Créer les modules pour chaque entité.

**Modules à créer :**

1. **UsersModule**
   - CRUD utilisateurs
   - Gestion des départements
   - Profil utilisateur

2. **ProjectsModule**
   - CRUD projets
   - Membres du projet
   - Statuts et priorités

3. **TasksModule**
   - CRUD tâches
   - Assignation
   - Statuts
   - Dépendances

4. **DocumentsModule**
   - Upload vers MinIO
   - Génération d'URLs signées
   - Gestion des permissions

5. **LeavesModule**
   - CRUD congés
   - Workflow d'approbation
   - Calcul des jours

6. **NotificationsModule**
   - Création de notifications
   - WebSocket pour le temps réel
   - Redis Pub/Sub

**Pour chaque module :**
```
module/
├── dto/
│   ├── create-entity.dto.ts
│   ├── update-entity.dto.ts
│   └── filter-entity.dto.ts
├── entities/
│   └── entity.entity.ts
├── module.controller.ts
├── module.service.ts
└── module.module.ts
```

---

### Phase 3 : Migration des données (Semaine 7-8)

**Objectif :** Migrer les données depuis Firestore.

**Script de migration :**

```typescript
// scripts/migrate-firestore-to-postgres.ts

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = getFirestore();

async function migrateUsers() {
  const snapshot = await db.collection('users').get();

  for (const doc of snapshot.docs) {
    const data = doc.data();

    await prisma.user.create({
      data: {
        id: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        createdAt: data.createdAt.toDate(),
      },
    });
  }

  console.log(`✅ Migrated ${snapshot.size} users`);
}

async function main() {
  await migrateUsers();
  await migrateProjects();
  await migrateTasks();
  // ...
}

main();
```

**Étapes :**
1. Export Firestore → JSON
2. Transformation des données
3. Import dans PostgreSQL
4. Vérification de l'intégrité

---

### Phase 4 : Tests et validation (Semaine 9-10)

**Objectif :** Tester intensivement.

**Tests à faire :**
1. Tests unitaires (couverture > 80%)
2. Tests d'intégration
3. Tests end-to-end
4. Tests de charge (Apache Bench, K6)
5. Tests de sécurité (OWASP)

**Outils :**
- Jest (tests unitaires)
- Supertest (tests e2e)
- K6 (tests de charge)

---

### Phase 5 : Déploiement (Semaine 11-12)

**Objectif :** Déployer en production.

**Infrastructure :**
- VPS (OVH, Hetzner, DigitalOcean)
- Docker Compose production
- Traefik (reverse proxy + SSL)
- Monitoring (Prometheus + Grafana)

**Fichier `docker-compose.prod.yml` :**
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - --providers.docker=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
      - --certificatesresolvers.letsencrypt.acme.email=admin@example.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt:/letsencrypt

  backend:
    image: ghcr.io/your-org/orchestr-a-backend:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:pass@postgres:5432/orchestra
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.example.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orchestra
      POSTGRES_USER: orchestra_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio-data:/data

volumes:
  postgres-data:
  redis-data:
  minio-data:
  letsencrypt:
```

---

## 🎯 Récapitulatif : Qu'as-tu appris ?

### Concepts

- ✅ **Backend vs Frontend** : séparation des responsabilités
- ✅ **API REST** : architecture client-serveur standardisée
- ✅ **ORM** : abstraction de la base de données
- ✅ **Migrations** : versioning du schéma de base
- ✅ **JWT** : authentification stateless
- ✅ **Docker** : conteneurisation des applications
- ✅ **CI/CD** : automatisation des tests et déploiements

### Technologies

- ✅ **NestJS** : framework backend TypeScript
- ✅ **Prisma** : ORM moderne type-safe
- ✅ **PostgreSQL** : base de données relationnelle
- ✅ **Redis** : cache et pub/sub
- ✅ **MinIO** : stockage d'objets S3-compatible
- ✅ **Docker Compose** : orchestration de conteneurs
- ✅ **GitHub Actions** : CI/CD

### Fichiers créés

- ✅ Structure backend complète
- ✅ Configuration Prisma
- ✅ Docker Compose dev
- ✅ Pipeline CI/CD
- ✅ Documentation

---

## 📖 Ressources pour aller plus loin

### Documentation officielle

- **NestJS** : https://docs.nestjs.com/
- **Prisma** : https://www.prisma.io/docs
- **PostgreSQL** : https://www.postgresql.org/docs/
- **Docker** : https://docs.docker.com/
- **TypeScript** : https://www.typescriptlang.org/docs/

### Tutoriels recommandés

- **NestJS Crash Course** (Traversy Media) : https://www.youtube.com/watch?v=GHTA143_b-s
- **Prisma Tutorial** : https://www.prisma.io/docs/getting-started
- **Docker for Beginners** : https://docker-curriculum.com/

### Livres

- **"Designing Data-Intensive Applications"** (Martin Kleppmann)
- **"Clean Architecture"** (Robert C. Martin)
- **"Domain-Driven Design"** (Eric Evans)

---

## ❓ FAQ

### Q1 : Pourquoi NestJS et pas Express.js ?

**Express.js :**
- ❌ Minimaliste (tu dois tout configurer)
- ❌ Pas de structure imposée (chacun fait comme il veut)
- ❌ Pas d'injection de dépendances native

**NestJS :**
- ✅ Architecture structurée (modules, contrôleurs, services)
- ✅ Injection de dépendances native
- ✅ TypeScript first-class
- ✅ Documentation auto-générée (Swagger)
- ✅ Écosystème riche

**Conclusion :** NestJS pour des projets structurés et maintenables à long terme.

---

### Q2 : Pourquoi PostgreSQL et pas MongoDB ?

**MongoDB (NoSQL) :**
- ❌ Pas de contraintes strictes (risque d'incohérences)
- ❌ Pas de jointures optimisées
- ❌ Duplication de données

**PostgreSQL (Relationnel) :**
- ✅ ACID (cohérence garantie)
- ✅ Jointures optimisées
- ✅ JSONB (flexibilité quand nécessaire)
- ✅ Mature et robuste

**Conclusion :** PostgreSQL pour des données structurées avec relations complexes.

---

### Q3 : Pourquoi Prisma et pas TypeORM ?

**TypeORM :**
- ❌ Bugs fréquents
- ❌ Maintenance erratique
- ❌ Performances moyennes

**Prisma :**
- ✅ Type-safety complet
- ✅ Auto-complétion parfaite
- ✅ Migrations simples
- ✅ Performances excellentes
- ✅ Maintenance active

**Conclusion :** Prisma est l'ORM moderne de référence en 2025.

---

### Q4 : Pourquoi Docker et pas installation native ?

**Installation native :**
- ❌ "Ça marche sur ma machine" (inconsistances)
- ❌ Pollution du système
- ❌ Configuration manuelle

**Docker :**
- ✅ Reproductible (même environnement partout)
- ✅ Isolation complète
- ✅ Démarrage en une commande
- ✅ Production-ready

**Conclusion :** Docker pour la reproductibilité et la simplicité.

---

### Q5 : C'est quoi la différence entre JWT access token et refresh token ?

**Access Token :**
- Durée de vie courte (15 minutes)
- Contient les infos de l'utilisateur
- Utilisé pour chaque requête API
- Si volé, exploitable seulement 15 minutes

**Refresh Token :**
- Durée de vie longue (30 jours)
- Utilisé uniquement pour obtenir un nouvel access token
- Stocké en base de données (révocable)
- Plus sécurisé (pas envoyé à chaque requête)

**Flux :**
```
1. Login → Reçoit access token + refresh token
2. Requêtes → Utilise access token
3. Access token expire → Utilise refresh token pour en obtenir un nouveau
4. Logout → Révoque le refresh token en base
```

---

## 🎉 Conclusion

**Tu as maintenant :**
- ✅ Une architecture backend moderne et scalable
- ✅ Un environnement de développement complet
- ✅ Des outils d'automatisation (CI/CD)
- ✅ Une base de code prête pour la migration

**Prochaine étape :**
👉 Implémente le module d'authentification (Phase 1)

**N'oublie pas :**
- Commit régulièrement sur Git
- Écris des tests pour chaque fonctionnalité
- Documente ton code
- Demande de l'aide si tu bloques

**Bonne chance pour la suite ! 🚀**

---

*Document créé le 11 octobre 2025*
*Pour le projet Orchestr'A - Migration Open-Source*
