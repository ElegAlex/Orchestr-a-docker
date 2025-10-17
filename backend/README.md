# 🚀 Orchestr'A Backend - NestJS API

Backend API pour Orchestr'A - Plateforme de gestion de projets open-source.

## 🛠️ Technologies

- **NestJS** : Framework Node.js progressif
- **TypeScript** : Langage typé
- **Prisma** : ORM moderne pour PostgreSQL
- **PostgreSQL** : Base de données relationnelle
- **Redis** : Cache et sessions
- **MinIO** : Stockage de fichiers (S3-compatible)
- **Passport** : Authentification (JWT + OAuth2)
- **Swagger** : Documentation API automatique

## 📋 Prérequis

- Node.js 18+
- Docker & Docker Compose (pour les services)
- npm ou yarn

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-org/orchestr-a.git
cd orchestr-a/backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Copier le fichier .env

```bash
cp .env.example .env
```

Éditer `.env` et configurer vos variables d'environnement.

### 4. Lancer les services Docker (PostgreSQL, Redis, MinIO)

**Option 1 - Docker Compose (Recommandé)**

```bash
# Démarrer tous les services en arrière-plan
docker-compose up -d

# Vérifier que les services sont lancés
docker-compose ps

# Voir les logs en temps réel
docker-compose logs -f
```

**Option 2 - Podman Compose**

```bash
# Installer podman-compose si nécessaire
pip3 install podman-compose

# Même syntaxe que docker-compose
podman-compose up -d
podman-compose ps
```

📖 **Pour plus de détails, voir [DOCKER_COMPOSE_GUIDE.md](./DOCKER_COMPOSE_GUIDE.md)**

### 5. Créer la base de données

```bash
npx prisma migrate dev --name init
```

Cette commande va :
- Créer la base de données si elle n'existe pas
- Appliquer le schéma Prisma
- Générer le client Prisma

### 6. (Optionnel) Remplir la base avec des données de test

```bash
npx prisma db seed
```

## 🏃 Lancer l'application

### Mode développement (avec hot-reload)

```bash
npm run start:dev
```

L'API sera accessible sur : http://localhost:4000/api

### Mode debug

```bash
npm run start:debug
```

### Mode production

```bash
npm run build
npm run start:prod
```

## 📚 Documentation API (Swagger)

Une fois l'application lancée, accéder à :

👉 http://localhost:4000/api/docs

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec coverage
npm run test:cov

# Tests e2e
npm run test:e2e

# Tests en mode watch
npm run test:watch
```

## 🗄️ Prisma Studio (Interface DB)

Pour explorer la base de données avec une interface graphique :

```bash
npx prisma studio
```

Interface disponible sur : http://localhost:5555

## 🐳 Docker

### Build de l'image

```bash
docker build -t orchestr-a-backend:latest .
```

### Lancer le container

```bash
docker run -p 4000:4000 --env-file .env orchestr-a-backend:latest
```

## 📁 Structure du Projet

```
backend/
├── src/
│   ├── main.ts                  # Entry point
│   ├── app.module.ts            # Module racine
│   ├── app.controller.ts        # Controller de base (health check)
│   ├── app.service.ts           # Service de base
│   ├── auth/                    # ✅ Module authentification (JWT)
│   ├── users/                   # ✅ Module utilisateurs
│   ├── projects/                # ✅ Module projets
│   ├── tasks/                   # ✅ Module tâches
│   ├── documents/               # ❌ Module documents (à venir)
│   ├── comments/                # ❌ Module commentaires (à venir)
│   ├── leaves/                  # ❌ Module congés (à venir)
│   ├── notifications/           # ❌ Module notifications (à venir)
│   ├── activities/              # ❌ Module logs (à venir)
│   └── prisma/                  # Module Prisma ORM
│
├── prisma/
│   ├── schema.prisma            # Schéma de base de données
│   └── migrations/              # Migrations versionnées
│
├── test/                        # Tests e2e
├── .env                         # Variables d'environnement (non versionné)
├── .env.example                 # Template variables d'environnement
├── docker-compose.yml           # 🐳 Infrastructure (PostgreSQL, Redis, MinIO)
├── DOCKER_COMPOSE_GUIDE.md      # 📖 Guide Docker Compose complet
├── .dockerignore                # Exclusions Docker
├── Dockerfile                   # Image Docker production (à venir)
├── nest-cli.json                # Configuration NestJS CLI
├── package.json                 # Dépendances npm
└── tsconfig.json                # Configuration TypeScript
```

## 🔧 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Lance en mode développement avec hot-reload |
| `npm run build` | Compile le projet TypeScript |
| `npm test` | Lance les tests unitaires |
| `npm run lint` | Lint et fix le code |
| `npx prisma migrate dev` | Crée une migration Prisma |
| `npx prisma studio` | Ouvre l'interface Prisma Studio |
| `npx prisma generate` | Génère le client Prisma |

## 🌐 URLs importantes

| Service | URL | Description |
|---------|-----|-------------|
| **API** | http://localhost:4000/api | API REST |
| **Swagger** | http://localhost:4000/api/docs | Documentation interactive |
| **Prisma Studio** | http://localhost:5555 | Interface DB |
| **MinIO Console** | http://localhost:9001 | Interface MinIO |

Credentials MinIO (dev) :
- User: `devuser`
- Password: `devpassword`

## 📖 Documentation

- [NestJS](https://docs.nestjs.com/)
- [Prisma](https://www.prisma.io/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)

## 🤝 Contribution

Voir le fichier [CONTRIBUTING.md](../CONTRIBUTING.md) à la racine du projet.

## 📝 Licence

MIT
