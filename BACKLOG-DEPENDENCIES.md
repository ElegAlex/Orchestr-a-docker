# Analyse des Dépendances - Backlog Orchestr'A

**Date:** 24 octobre 2025
**Objectif:** Identifier les dépendances entre bugs et fonctionnalités pour optimiser l'ordre de résolution

---

## Table des Matières

1. [Graphe de Dépendances](#1-graphe-de-dépendances)
2. [Clusters de Bugs](#2-clusters-de-bugs)
3. [Chemins Critiques](#3-chemins-critiques)
4. [Ordre de Résolution Optimisé](#4-ordre-de-résolution-optimisé)
5. [Risques et Blocages](#5-risques-et-blocages)

---

## 1. Graphe de Dépendances

### Légende
- `[X] → [Y]` : X doit être résolu avant Y
- `[X] ↔ [Y]` : X et Y sont liés (même module)
- `[X] ⊕ [Y]` : X et Y peuvent être résolus en parallèle
- 🔴 Bloquant | 🟠 Impact moyen | 🟢 Indépendant

---

### Cluster 1: Gestion des Congés 🔴

```
BUG-01 (Jours fériés)
  ↓ [BLOQUE]
BUG-03 (Saisie RTT solde zéro)
  ↓ [IMPACT FORT]
FEAT-01 (Workflow validation congés)
  ↓ [IMPACT]
BUG-02 (Modification congé par user)
```

**Analyse:**
- **BUG-01** est CRITIQUE pour BUG-03 car :
  - BUG-01 corrige le calcul de jours ouvrés (26/12 Saint-Étienne)
  - BUG-03 nécessite un calcul correct pour autoriser solde négatif
  - Si calcul erroné → soldes incorrects → problème amplifié

- **BUG-03** bloque FEAT-01 car :
  - FEAT-01 ajoute workflow validation (PENDING → APPROVED)
  - BUG-03 change la logique de validation (permettre solde négatif)
  - Risque de refaire le code 2 fois si BUG-03 après FEAT-01

- **FEAT-01** impacte BUG-02 car :
  - FEAT-01 change les permissions (qui peut approuver/rejeter)
  - BUG-02 concerne permissions de modification
  - Mieux vaut résoudre BUG-02 avant pour éviter conflit

**Ordre Optimal:**
```
1. BUG-01 (Supprimer jours fériés custom)
2. BUG-03 (Autoriser solde RTT négatif)
3. BUG-02 (Permissions modification congé)
4. FEAT-01 (Workflow validation)
```

---

### Cluster 2: Permissions et Droits 🟠

```
BUG-02 (Modification congé par user)
  ↔ [MÊME MODULE]
BUG-05 (Droits télétravail futurs)
  ↔ [MÊME MODULE]
BUG-06 (Statut tâches projet)
```

**Analyse:**
- **Tous impactent `RolesGuard` et permissions**
- **BUG-02** : `leaves.service.ts` + Guards
- **BUG-05** : `telework.service.ts` + Guards
- **BUG-06** : `tasks.service.ts` + Guards

**Risque de conflit:** Modifier les Guards 3 fois séparément peut créer régressions

**Solution:** Traiter en bloc après analyse globale des permissions

**Ordre Optimal:**
```
1. Audit global des permissions (1h)
2. BUG-02 + BUG-05 + BUG-06 en parallèle (après audit)
```

---

### Cluster 3: Dashboard et Tâches 🟢

```
BUG-07 (Tâches simples dépassées)
  ⊕ [INDÉPENDANT]
BUG-04 (Suppression tâche simple)
  ⊕ [INDÉPENDANT]
```

**Analyse:**
- **Aucune dépendance** entre eux
- **Même fichier** (`simple-tasks.service.ts`) mais fonctions différentes
- **Quick wins** parfaits pour commencer

**Ordre:** Indifférent (peuvent être faits en parallèle ou séquentiellement)

---

### Cluster 4: Interface Utilisateur 🟢

```
UI-01 (Bouton "Déclarer absence")
  ⊕ [INDÉPENDANT]
UI-02 (Bouton "Tout sélectionner" services)
  ⊕ [INDÉPENDANT]
UI-03 (Clarifier "tâche simple")
  ⊕ [INDÉPENDANT]
```

**Analyse:**
- **Totalement indépendants** les uns des autres
- **Pure UI** sans impact logique métier
- **Quick wins** pour satisfaction utilisateur rapide

**Ordre:** Indifférent

---

### Cluster 5: Fonctionnalités Calendrier 🟢

```
FEAT-03 (Filtre week-ends)
  ⊕ [INDÉPENDANT]
FEAT-02 (Zones vacances)
  ⊕ [DÉJÀ FAIT ?]
```

**Analyse:**
- **FEAT-02** semble déjà implémentée (à vérifier)
- **FEAT-03** est simple et indépendante

---

### Cluster 6: Commentaires et Projets ⚠️

```
BUG-08 (Commentaires tâches)
  ⚠️ [À VÉRIFIER EN PRIORITÉ]
FEAT-04 (Projets terminés récemment)
  ⊕ [INDÉPENDANT]
```

**Analyse:**
- **BUG-08** : Code semble fonctionnel, possible faux bug
- **Action:** Vérifier en PRIORITÉ pour ne pas perdre temps

---

## 2. Clusters de Bugs

### Classification par Impact et Dépendances

| Cluster | Bugs | Type Dépendance | Impact | Priorité |
|---------|------|-----------------|--------|----------|
| **Congés** | BUG-01, BUG-03, BUG-02, FEAT-01 | 🔴 Forte chaîne | Business critical | 🔥 URGENT |
| **Permissions** | BUG-02, BUG-05, BUG-06 | 🟠 Module partagé | Sécurité | ⚠️ HAUTE |
| **Dashboard** | BUG-07, BUG-04 | 🟢 Indépendants | UX | ✅ MOYENNE |
| **UI/UX** | UI-01, UI-02, UI-03 | 🟢 Indépendants | Ergonomie | ✅ MOYENNE |
| **Calendrier** | FEAT-03, FEAT-02 | 🟢 Indépendants | Confort | ⏸️ BASSE |
| **Projets** | BUG-08, FEAT-04 | ⚠️ À vérifier | Variable | ❓ À ÉVALUER |

---

## 3. Chemins Critiques

### Chemin Critique 1: Workflow Congés Complet
**Durée totale:** 12-14 jours
**Impact:** Résout 4 bugs majeurs + 1 feature prioritaire

```
Jour 1-2:   BUG-01 (Config jours fériés)           [4h]
            └─ Fichier: holidays.service.ts
            └─ Action: DELETE endpoint + UI

Jour 3:     BUG-03 (Solde RTT négatif)             [6h]
            └─ Fichier: leaves.service.ts
            └─ Dépend: BUG-01 (calcul correct)

Jour 4:     BUG-02 (Permissions modification)      [4h]
            └─ Fichier: leaves.service.ts + Guards
            └─ Dépend: Clarification workflow

Jour 5-7:   FEAT-01 (Workflow validation)          [2-3 jours]
            └─ Fichiers: leaves.service.ts + Frontend + Notifications
            └─ Dépend: BUG-01, BUG-02, BUG-03 résolus

Total: 3.5-4 jours
Impact: Résout problème #1 des utilisateurs (workflow déclaratif → validation)
```

### Chemin Critique 2: Quick Wins Dashboard
**Durée totale:** 1 jour
**Impact:** Satisfaction utilisateur rapide

```
Matin:      BUG-07 (Tâches dépassées dashboard)    [2h]
            └─ Fichier: dashboard-hub-v2.service.ts
            └─ Action: Ajouter filtre date >= today

Matin:      BUG-04 (Suppression tâche simple)      [2h]
            └─ Fichier: simple-tasks.service.ts
            └─ Action: Vérifier createdBy === currentUser

Après-midi: UI-02 (Tout sélectionner services)     [2h]
            └─ Fichier: PlanningCalendar.tsx
            └─ Action: Checkbox "Tout cocher"

Après-midi: UI-01 (Bouton déclarer absence)        [2h]
            └─ Fichier: DashboardHub.tsx
            └─ Action: Bouton + navigation

Total: 1 jour
Impact: 4 améliorations visibles immédiatement
```

### Chemin Critique 3: Permissions Globales
**Durée totale:** 1.5 jours
**Impact:** Résout tous problèmes de droits

```
Jour 1 matin: Audit permissions global             [2h]
              └─ Analyser Guards + RolesGuard
              └─ Documenter règles actuelles

Jour 1 après-midi:
              BUG-05 (Télétravail futurs)           [3h]
              └─ Fichier: telework.service.ts + Guards
              └─ Action: Vérifier permissions dates futures

Jour 2 matin: BUG-06 (Statut tâches équipe)        [3h]
              └─ Fichier: tasks.service.ts + permissions
              └─ Action: Assouplir droits membres équipe

Total: 1.5 jours
Impact: Système de permissions cohérent
Note: BUG-02 est dans Chemin Critique 1
```

---

## 4. Ordre de Résolution Optimisé

### Stratégie Recommandée: "Quick Wins d'abord, puis Critiques"

#### Sprint 1: Quick Wins (Jour 1) ⚡
**Objectif:** Montrer résultats rapides, comprendre codebase

| Ordre | Bug | Durée | Fichiers | Justification |
|-------|-----|-------|----------|---------------|
| 1 | **BUG-07** | 2h | `dashboard-hub-v2.service.ts` | 1 ligne à modifier, test facile |
| 2 | **BUG-04** | 2h | `simple-tasks.service.ts` | Permission simple à vérifier |
| 3 | **UI-02** | 2h | `PlanningCalendar.tsx` | Demande explicite utilisateur |
| 4 | **UI-01** | 2h | `DashboardHub.tsx` | Améliore ergonomie congés |

**Résultat Jour 1:** 4 bugs résolus, utilisateurs satisfaits, codebase comprise ✅

---

#### Sprint 2: Configuration Jours Fériés (Jour 2) 🔧
**Objectif:** Débloquer le workflow congés

| Ordre | Bug | Durée | Fichiers | Justification |
|-------|-----|-------|----------|---------------|
| 5 | **BUG-01** | 4h | `holidays.service.ts` + `holidays.controller.ts` + UI | BLOQUE BUG-03, prioritaire |

**Résultat Jour 2:** Calcul congés correct (26/12 Saint-Étienne résolu) ✅

---

#### Sprint 3: Permissions Audit (Jour 3 matin) 🔍
**Objectif:** Comprendre architecture permissions avant modifications

| Ordre | Tâche | Durée | Fichiers | Justification |
|-------|-------|-------|----------|---------------|
| - | **Audit Permissions** | 2h | Guards + services | Évite régressions sur BUG-02/05/06 |

---

#### Sprint 4: Logique Congés (Jour 3-4) 💼
**Objectif:** Résoudre bugs bloquants workflow

| Ordre | Bug | Durée | Fichiers | Justification |
|-------|-----|-------|----------|---------------|
| 6 | **BUG-03** | 6h | `leaves.service.ts` + frontend | Dépend BUG-01, nécessite clarification user |
| 7 | **BUG-02** | 4h | `leaves.service.ts` + Guards | Prépare FEAT-01 |

**Résultat Jour 3-4:** Logique congés cohérente ✅

---

#### Sprint 5: Permissions Restantes (Jour 5) 🔐
**Objectif:** Finaliser tous bugs permissions

| Ordre | Bug | Durée | Fichiers | Justification |
|-------|-----|-------|----------|---------------|
| 8 | **BUG-05** | 3h | `telework.service.ts` + Guards | Après audit permissions |
| 9 | **BUG-06** | 3h | `tasks.service.ts` + permissions | Nécessite clarification user |

**Résultat Jour 5:** Permissions cohérentes ✅

---

#### Sprint 6: Workflow Validation Congés (Jour 6-8) 🌟
**Objectif:** Feature prioritaire demandée

| Ordre | Feature | Durée | Fichiers | Justification |
|-------|---------|-------|----------|---------------|
| 10 | **FEAT-01** | 2-3j | `leaves.service.ts` + Frontend + Notifications | HAUTE PRIORITÉ utilisateurs |

**Résultat Jour 6-8:** Workflow validation opérationnel ✅

---

#### Sprint 7: UX Finitions (Jour 9) 🎨
**Objectif:** Peaufiner expérience utilisateur

| Ordre | Feature | Durée | Fichiers | Justification |
|-------|---------|-------|----------|---------------|
| 11 | **UI-03** | 1h | Components tâches simples | Wording + tooltip |
| 12 | **FEAT-03** | 3h | `MonthView.tsx` | Demande utilisateur calendrier |
| 13 | **FEAT-04** | 4h | Reports + API | Nouveau widget rapports |

**Résultat Jour 9:** Expérience utilisateur optimisée ✅

---

#### Sprint 8: Vérification et Tests (Jour 10) ✅
**Objectif:** Valider fonctionnalités et résoudre faux bugs

| Ordre | Tâche | Durée | Fichiers | Justification |
|-------|-------|-------|----------|---------------|
| - | **Vérifier BUG-08** | 2h | `TaskComments.tsx` + API | Code semble fonctionnel |
| - | **Vérifier FEAT-02** | 1h | `school-holidays.service.ts` | Déjà implémenté ? |
| - | **BUG-08 (si réel)** | 6h | Commentaires system | Seulement si bug confirmé |

**Résultat Jour 10:** Backlog nettoyé, bugs confirmés résolus ✅

---

## 5. Risques et Blocages

### Risques Identifiés

#### 🔴 RISQUE CRITIQUE 1: Clarifications Métier Manquantes

**Bug concerné:** BUG-03 (Solde RTT négatif)
**Question bloquante:** Accepter soldes RTT négatifs temporaires ?

**Options:**
- **Option A:** Autoriser solde négatif illimité
  - ✅ Simple à implémenter
  - ❌ Risque d'abus

- **Option B:** Autoriser solde négatif limité (ex: -5 jours max)
  - ✅ Compromis sécurité/flexibilité
  - ⚠️ Nécessite règle métier

- **Option C:** Système d'avance sur congés (demande formelle)
  - ✅ Traçabilité complète
  - ❌ Complexe (workflow additionnel)

**Recommandation:** Option B (solde négatif limité)
**Action requise:** Obtenir validation avant Jour 3

---

#### 🟠 RISQUE MOYEN 2: Droits Équipe Projet Ambigus

**Bug concerné:** BUG-06 (Statut tâches projet)
**Question bloquante:** Qui peut changer statut tâche ?

**Options:**
- **Option A:** Tous membres équipe projet
  - ✅ Flexibilité maximale
  - ❌ Risque changements non voulus

- **Option B:** Assignee + Manager seulement
  - ✅ Contrôle strict
  - ❌ Moins flexible pour équipes autonomes

- **Option C:** Assignee + Membres équipe (pas viewers)
  - ✅ Équilibre
  - ⚠️ Nécessite vérifier rôle projet vs rôle global

**Recommandation:** Option C
**Action requise:** Obtenir validation avant Jour 5

---

#### 🟢 RISQUE FAIBLE 3: Faux Bug Commentaires

**Bug concerné:** BUG-08 (Commentaires KO)
**Observation:** Code semble totalement fonctionnel

**Fichiers vérifiés:**
- ✅ Backend: `comments.service.ts` (100+ lignes, complet)
- ✅ Frontend: `TaskComments.tsx` (350 lignes, complet)
- ✅ API: Endpoints CRUD complets

**Hypothèses possibles:**
1. Bug résolu entre-temps (statut non mis à jour)
2. Problème spécifique à un projet (pas généralisé)
3. Problème de permissions (user test n'avait pas droits)
4. Confusion avec autre fonctionnalité

**Action requise:** Tests manuels AVANT de modifier quoi que ce soit

---

#### 🟢 RISQUE FAIBLE 4: Feature Déjà Implémentée

**Feature concernée:** FEAT-02 (Zones vacances scolaires)
**Observation:** Code montre support zones A/B/C

**Fichiers vérifiés:**
- ✅ Backend: `school-holidays.service.ts` (190 lignes)
- ✅ Database: Model `SchoolHoliday` avec enum `SchoolHolidayZone { A, B, C, ALL }`
- ✅ Frontend: `MonthView.tsx` affiche zones

**Action requise:** Vérification UI pour confirmer affichage correct

---

### Dépendances Externes

#### Base de Données
- ✅ PostgreSQL opérationnel
- ✅ Prisma migrations à jour
- ⚠️ Vérifier données jours fériés existantes avant BUG-01

#### Environnement
- ✅ Docker containers actifs
- ✅ Backend NestJS fonctionnel
- ✅ Frontend React build opérationnel

#### Permissions Git
- ⚠️ Créer branches pour chaque bug
- ⚠️ Pull requests pour review
- ⚠️ Tests avant merge

---

## 6. Points de Décision Critiques

### Décisions Requises AVANT de Commencer

| Jour | Décision | Bug Bloqué | Impact |
|------|----------|------------|--------|
| **Jour 0** | Stratégie Quick Wins d'abord ? | Tous | Ordre complet |
| **Jour 2** | Solde RTT négatif: quelle limite ? | BUG-03 | Logique validation |
| **Jour 4** | Droits équipe projet: qui peut modifier ? | BUG-06 | Permissions |
| **Jour 5** | FEAT-01: workflow simple ou multi-niveaux ? | FEAT-01 | Architecture |

---

## 7. Métriques de Suivi

### Indicateurs de Progrès

```
Bugs Critiques (Priorité Haute):
├─ BUG-01 □ Jours fériés custom
├─ BUG-02 □ Modification congé user
├─ BUG-03 □ Saisie RTT solde zéro
├─ FEAT-01 □ Workflow validation congés
└─ Total: 0/4 résolus (0%)

Quick Wins (Satisfaction Rapide):
├─ BUG-07 □ Tâches simples dépassées
├─ BUG-04 □ Suppression tâche simple
├─ UI-02 □ Tout sélectionner services
└─ Total: 0/3 résolus (0%)

Permissions (Sécurité):
├─ BUG-02 □ (déjà compté ci-dessus)
├─ BUG-05 □ Droits télétravail futurs
├─ BUG-06 □ Statut tâches équipe
└─ Total: 0/2 résolus (0%)

UX/UI (Ergonomie):
├─ UI-01 □ Bouton déclarer absence
├─ UI-03 □ Clarifier tâche simple
├─ FEAT-03 □ Filtre week-ends
└─ Total: 0/3 résolus (0%)

À Vérifier:
├─ BUG-08 □ Commentaires (faux bug ?)
├─ FEAT-02 □ Zones vacances (déjà fait ?)
├─ FEAT-04 □ Projets terminés récemment
└─ Total: 0/3 vérifiés (0%)

TOTAL BACKLOG: 0/15 items traités (0%)
```

---

## 8. Plan d'Action Recommandé

### Jour 1 (Aujourd'hui) - Quick Wins ⚡

**Matin (4h):**
```bash
9h00-11h00: BUG-07 + BUG-04 (Dashboard/Tâches simples)
11h00-13h00: UI-02 (Tout sélectionner services)
```

**Après-midi (4h):**
```bash
14h00-16h00: UI-01 (Bouton déclarer absence)
16h00-18h00: Tests manuels + déploiement
```

**Livrables Jour 1:**
- 4 bugs résolus
- Satisfaction utilisateur immédiate
- Compréhension codebase acquise

---

### Jour 2 - Configuration Critique 🔧

**Matin (4h):**
```bash
9h00-13h00: BUG-01 (Endpoint DELETE jours fériés + UI)
```

**Après-midi (4h):**
```bash
14h00-16h00: Tests BUG-01
16h00-17h00: DÉCISION sur BUG-03 (solde négatif)
17h00-18h00: Tests BUG-08 et FEAT-02 (vérifications)
```

**Livrables Jour 2:**
- Configuration jours fériés fonctionnelle
- Décision métier BUG-03 obtenue
- Bugs potentiellement faux identifiés

---

### Jours 3-4 - Logique Congés 💼

**BUG-03 puis BUG-02**

---

### Jour 5 - Permissions 🔐

**BUG-05 puis BUG-06**

---

### Jours 6-8 - Workflow Validation 🌟

**FEAT-01**

---

### Jour 9 - Finitions UX 🎨

**UI-03, FEAT-03, FEAT-04**

---

### Jour 10 - Validation Finale ✅

**Tests, BUG-08 (si réel), Documentation**

---

## Conclusion

**Durée totale estimée:** 10 jours ouvrés (2 semaines)
**Bugs résolus:** 15/15 (100%)
**Approche:** Quick Wins → Critiques → Permissions → Features

**Prochain pas:** Obtenir validation pour commencer Jour 1 (Quick Wins)

---

**Document créé le:** 24 octobre 2025
**Dernière mise à jour:** 24 octobre 2025
