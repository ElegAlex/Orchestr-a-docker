# ==========================================
# Dockerfile - Orchestr'A Backend (NestJS)
# ==========================================
# Ce fichier permet de créer une image Docker
# pour le backend NestJS en production.

# Étape 1: Build (compilation TypeScript)
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances d'abord (cache Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances (dev incluses pour le build)
RUN npm ci --prefer-offline --no-audit

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY . .

# Supprimer les fichiers de tests pour alléger
RUN find . -name "*.spec.ts" -delete && \
    find . -name "*.test.ts" -delete && \
    find . -name "*.e2e-spec.ts" -delete

# Build de l'application
RUN npm run build

# Copier .prisma et prisma AVANT de supprimer node_modules
RUN mkdir -p /tmp/prisma-backup && \
    cp -r /app/node_modules/.prisma /tmp/prisma-backup/ && \
    cp -r /app/prisma /tmp/prisma-backup/

# Nettoyer node_modules dev
RUN rm -rf node_modules

# Étape 2: Production (image finale légère)
FROM node:18-alpine

# Installer OpenSSL (pour Prisma) et wget (pour healthcheck)
RUN apk add --no-cache openssl wget

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer seulement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier le code compilé depuis l'étape builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /tmp/prisma-backup/.prisma ./node_modules/.prisma
COPY --from=builder /tmp/prisma-backup/prisma ./prisma

# Créer un utilisateur non-root pour sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Changer vers l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 4000

# Variable d'environnement
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/api/health || exit 1

# Commande de démarrage
CMD ["node", "dist/main"]
