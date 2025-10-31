# 🔄 WORKFLOW GITHUB - Guide Complet

## 🚀 PUSH RAPIDE (Usage Quotidien)

```bash
# 1. Ajouter tous les fichiers modifiés
git add -A

# 2. Créer le commit avec message descriptif
git commit -m "fix: description courte du changement"

# 3. Pusher sur GitHub
git push origin master
```

**C'est tout !** La clé SSH est déjà configurée.

---

## 📝 MESSAGES DE COMMIT

### Format Recommandé
```
type(scope): description courte

Description détaillée (optionnelle)
```

### Types Courants
- `fix:` - Correction de bug
- `feat:` - Nouvelle fonctionnalité
- `refactor:` - Refactoring code
- `docs:` - Documentation
- `style:` - Formatage, style
- `test:` - Ajout/modification tests
- `chore:` - Maintenance, config

### Exemples
```bash
git commit -m "fix(planning): correction affichage jours vides"
git commit -m "feat(auth): ajout authentification 2FA"
git commit -m "docs: mise à jour README avec instructions Docker"
```

---

## 🔑 CONFIGURATION SSH (Déjà Fait)

### Clé SSH Actuelle
```
Fichier: ~/.ssh/id_ed25519
Type: ED25519
Fingerprint: SHA256:kjeviORAZg8h6lqhpDniUIKRA/f899/L7bO4jbb9j2w
```

### Remote GitHub
```
URL: git@github.com:ElegAlex/Orchestr-a-docker.git
Protocol: SSH
Branch: master
```

### Vérification Configuration
```bash
# Voir le remote actuel
git remote -v

# Tester la connexion SSH
ssh -T git@github.com

# Résultat attendu: "Hi ElegAlex! You've successfully authenticated..."
```

---

## 🛠️ COMMANDES UTILES

### Voir l'État du Repository
```bash
# Fichiers modifiés
git status

# Différences
git diff

# Historique commits
git log --oneline -10
```

### Annuler des Modifications
```bash
# Annuler fichier non stagé
git checkout -- fichier.ts

# Retirer du staging (avant commit)
git reset HEAD fichier.ts

# Annuler dernier commit (garder modifs)
git reset --soft HEAD~1
```

### Gestion Branches
```bash
# Créer nouvelle branch
git checkout -b feature/nom-feature

# Changer de branch
git checkout master

# Voir toutes les branches
git branch -a
```

---

## 🔒 FICHIERS SENSIBLES (Déjà Configurés)

### Fichiers dans .gitignore
```
orchestra-app/service-account-real.json
backend/service-account-key.json
*.env
*.env.local
node_modules/
build/
dist/
```

### Vérifier qu'un Fichier est Ignoré
```bash
git check-ignore -v orchestra-app/service-account-real.json
```

---

## ⚠️ PROBLÈMES COURANTS

### 1. Push Refusé (Secret Détecté)
**Symptôme** : `GH013: Repository rule violations - Push cannot contain secrets`

**Solution** :
```bash
# Retirer le fichier du commit
git rm --cached chemin/fichier-secret.json

# Ajouter au .gitignore
echo "chemin/fichier-secret.json" >> .gitignore

# Amender le commit
git commit --amend --no-edit

# Si le secret est dans un ancien commit:
# Autoriser sur GitHub via l'URL fournie dans l'erreur
```

### 2. Authentication Failed
**Symptôme** : `Permission denied (publickey)`

**Solution** :
```bash
# Vérifier que la clé SSH existe
ls -la ~/.ssh/id_ed25519

# Vérifier remote en SSH (pas HTTPS)
git remote -v
# Doit afficher: git@github.com:... (pas https://)

# Si HTTPS, changer en SSH
git remote set-url origin git@github.com:ElegAlex/Orchestr-a-docker.git
```

### 3. Merge Conflicts
**Symptôme** : `CONFLICT (content): Merge conflict in fichier.ts`

**Solution** :
```bash
# 1. Ouvrir le fichier avec conflit
# 2. Chercher les marqueurs <<<<<<< ======= >>>>>>>
# 3. Éditer manuellement pour résoudre
# 4. Ajouter et commiter
git add fichier.ts
git commit -m "fix: résolution conflit merge"
```

### 4. Commit sur Mauvaise Branch
**Symptôme** : Commit fait sur `master` au lieu de `feature-branch`

**Solution** :
```bash
# Déplacer dernier commit sur nouvelle branch
git branch feature-branch
git reset --hard HEAD~1
git checkout feature-branch
```

---

## 📦 WORKFLOW COMPLET (Feature → Master)

### Développement Feature
```bash
# 1. Créer branch feature
git checkout -b feature/nouvelle-feature

# 2. Développer et commiter
git add fichiers-modifies.ts
git commit -m "feat: description feature"

# 3. Pusher branch sur GitHub
git push origin feature/nouvelle-feature
```

### Merge vers Master
```bash
# 1. Revenir sur master
git checkout master

# 2. Mettre à jour master
git pull origin master

# 3. Merger la feature
git merge feature/nouvelle-feature

# 4. Pusher master
git push origin master

# 5. (Optionnel) Supprimer branch feature
git branch -d feature/nouvelle-feature
git push origin --delete feature/nouvelle-feature
```

---

## 🔍 VÉRIFICATIONS AVANT PUSH

### Checklist
- [ ] `git status` → Pas de fichiers sensibles (*.env, service-account-*.json)
- [ ] `git diff` → Vérifier changements cohérents
- [ ] Tests locaux → Frontend et Backend fonctionnent
- [ ] Message commit → Descriptif et clair
- [ ] Branch → Sur la bonne branch (master ou feature)

### Commande de Vérification Rapide
```bash
# Voir ce qui sera pushé
git log origin/master..HEAD --oneline

# Voir les fichiers modifiés
git diff --name-only origin/master..HEAD
```

---

## 📚 RESSOURCES

### Documentation Git
- Git Basics: https://git-scm.com/book/en/v2/Getting-Started-Git-Basics
- GitHub SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### Configuration Actuelle
```bash
# Voir toute la config git
git config --list

# Voir config user
git config user.name
git config user.email
```

### Fichiers Config Importants
- `~/.ssh/id_ed25519` - Clé privée SSH (NE JAMAIS PARTAGER)
- `~/.ssh/id_ed25519.pub` - Clé publique SSH (sur GitHub)
- `~/.gitconfig` - Configuration Git globale
- `.git/config` - Configuration Git locale (dans le repo)

---

## 🎯 RÉSUMÉ ULTRA-RAPIDE

**Pour pusher sur GitHub** :
```bash
git add -A && git commit -m "fix: mon changement" && git push origin master
```

**C'est tout !** 🚀

---

**Dernière mise à jour** : 31 octobre 2025
**Clé SSH** : Configurée et fonctionnelle
**Repository** : https://github.com/ElegAlex/Orchestr-a-docker
