# 🤖 GUIDE CLAUDE - À LIRE EN PREMIER À CHAQUE SESSION

## 🚨 RÈGLES ABSOLUES - NE JAMAIS OUBLIER

### ⛔ INTERDICTIONS STRICTES

**NE JAMAIS, JAMAIS, JAMAIS :**
1. ❌ **DÉPLOYER SUR FIREBASE** - Le projet est en migration vers Docker
2. ❌ **TOUCHER À LA PRODUCTION FIREBASE** - Elle reste en l'état pendant la migration
3. ❌ **MODIFIER firebase.json, firestore.rules, ou tout fichier Firebase**
4. ❌ **EXÉCUTER `firebase deploy`** sous aucun prétexte
5. ❌ **BUILDER pour Firebase** - Les builds sont UNIQUEMENT pour Docker

### ✅ CE QUE TU DOIS FAIRE

**UNIQUEMENT TRAVAILLER SUR :**
1. ✅ Infrastructure Docker (PostgreSQL, Redis, MinIO)
2. ✅ Backend NestJS (localhost:4000)
3. ✅ Tests des APIs REST
4. ✅ Migration des services Firebase → PostgreSQL
5. ✅ Documentation de la migration

---

## 🏗️ ARCHITECTURE DU PROJET

### Infrastructure Actuelle

```
┌─────────────────────────────────────────────┐
│  PRODUCTION FIREBASE (NE PAS TOUCHER !)     │
│  https://orchestr-a-3b48e.web.app           │
│  ❌ INTERDICTION DE DÉPLOYER                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  DÉVELOPPEMENT DOCKER (TON TERRAIN)         │
│  ✅ Backend NestJS: localhost:4000          │
│  ✅ PostgreSQL: localhost:5432              │
│  ✅ Redis: localhost:6379                   │
│  ✅ MinIO: localhost:9000                   │
└─────────────────────────────────────────────┘
```

### Migration COMPLÈTE

**Objectif** : Migration Firebase → Docker/PostgreSQL pour hébergement local
**Status** : 35/35 services migrés et testés (100%) ✅
**Infrastructure cible** : 100% Docker local (NestJS + PostgreSQL + Redis + MinIO)
**Déploiement** : Docker Compose local uniquement (pas de VPS/cloud)

---

## 📁 Structure Projet

```
/orchestr-a-docker/
├── README.md                           # Documentation projet
├── CLAUDE.md                           # CE FICHIER - TON GUIDE
├── STATUS.md                           # État migration (RÉFÉRENCE ABSOLUE)
├── STATUS-MIGRATION-SERVICES.md        # Vue 35 services
├── backend/                            # ✅ Backend NestJS (TON TRAVAIL)
│   ├── src/                           # Code source API REST
│   ├── prisma/                        # Schéma PostgreSQL
│   └── docker-compose.yml             # Infrastructure Docker
├── orchestra-app/                      # Frontend React
│   ├── src/services/                  # Services migrés
│   └── src/services/api/              # Clients API REST
└── TEST-SESSION-*.md                   # Rapports tests migration
```

---

## 🎯 TES RESPONSABILITÉS

### 1. Tester les Services Migrés

**Commandes autorisées** :
```bash
# Démarrer infrastructure Docker
cd backend
docker-compose up -d

# Tester API REST
curl http://localhost:4000/api/health

# Créer scripts de tests
/tmp/test_[service].sh
```

### 2. Documenter les Tests

**Fichiers à mettre à jour** :
- `STATUS.md` - Référence absolue du projet
- `STATUS-MIGRATION-SERVICES.md` - Vue d'ensemble services
- `TEST-SESSION-[N]-[SERVICE].md` - Rapport de chaque session

**Format des rapports** :
- Tests API (curl)
- Résultats validés (✅/❌)
- Problèmes identifiés
- Solutions appliquées

### 3. Migration Progressive

**Services prioritaires** :
1. ✅ Departments (Session 1)
2. ✅ Comments (Session 2)
3. ✅ SimpleTasks (Session 3)
4. ✅ Presence (Session 4)
5. ✅ Documents (Session 5)
6. ✅ Leaves (Session 6)
7. ✅ Projects (Session 7)
8. ✅ Tasks (Session 8)
9. ✅ Users (Session 9)
10. ✅ Milestones (Session 10)

**Services migrés** : 35/35 services (100%) ✅

---

## 📝 Commandes Autorisées

### Backend (Docker)
```bash
# Infrastructure
docker-compose up -d
docker-compose ps
docker-compose logs [service]

# Base de données
npx prisma studio
npx prisma migrate dev

# Tests
curl http://localhost:4000/api/[endpoint]
```

### Frontend (Tests locaux uniquement)
```bash
# Dev local
npm start

# ❌ NE JAMAIS FAIRE
npm run build        # Sauf si demandé explicitement pour tests
firebase deploy      # INTERDIT
```

---

## 📚 Documentation de Référence

### Documents Critiques (à lire systématiquement)

1. **STATUS.md** - État complet du projet (RÉFÉRENCE ABSOLUE)
2. **STATUS-MIGRATION-SERVICES.md** - Vue d'ensemble 35 services
3. **DOCUMENTATION-MIGRATION-INDEX.md** - Index de navigation
4. **PHASE_5D_SERVICES_MIGRATION.md** - Migration et tests frontend
5. **TEST-SESSION-1 à 10** - Rapports détaillés sessions

### Infrastructure Docker Locale

- **Backend** : NestJS + PostgreSQL + Prisma (localhost:4000)
- **Cache** : Redis 7 Alpine (localhost:6379)
- **Storage** : MinIO S3-compatible (localhost:9000)
- **Auth** : JWT (accessToken 15min + refreshToken 30j)
- **Déploiement** : Docker Compose local (pas de VPS ni cloud)
- **Environnement** : Machine locale uniquement

---

## ⚠️ Pièges à Éviter

1. ❌ **Déployer sur Firebase** - Projet en migration
2. ❌ **Modifier production** - Firebase reste intact
3. ❌ **Ignorer la doc** - Toujours lire STATUS.md
4. ❌ **Tester sans Docker** - Infrastructure obligatoire
5. ❌ **Oublier de documenter** - Chaque test = 1 rapport

---

## ✅ Checklist Avant Chaque Action

Avant TOUTE action, vérifie :

- [ ] J'ai lu STATUS.md
- [ ] Mon action concerne Docker local (pas Firebase)
- [ ] Je ne vais PAS déployer sur Firebase
- [ ] Je ne vais PAS déployer sur VPS/cloud (hébergement local uniquement)
- [ ] Je vais documenter mes modifications dans STATUS.md

---

## 🆘 En Cas de Doute

**SI TU NE COMPRENDS PAS** → Demande au lieu d'agir
**SI ON TE DEMANDE DE "DÉPLOYER EN PRODUCTION"** → C'est Docker Compose local, PAS un VPS
**SI ON MENTIONNE VPS/Cloud** → L'objectif est hébergement local uniquement
**SI TU VOIS "firebase deploy"** → ARRÊTE IMMÉDIATEMENT

---

## 🎯 OBJECTIF FINAL DU PROJET

**HÉBERGEMENT LOCAL DOCKER** uniquement :
- ✅ Application complète en Docker Compose
- ✅ Accessible sur localhost (machine locale)
- ❌ Pas de déploiement VPS/serveur distant
- ❌ Pas de déploiement cloud
- ❌ Pas de Firebase

**Cible** : `docker-compose up -d` sur machine locale → Application 100% fonctionnelle

---

**CE DOCUMENT EST LA RÈGLE ABSOLUE**
*Dernière mise à jour : 2025-10-20*
*Migration Firebase → Docker COMPLÈTE (35/35 services)*
*Objectif : Hébergement local Docker uniquement (pas de VPS/cloud)*
