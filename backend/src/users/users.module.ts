import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * Module de gestion des utilisateurs
 *
 * Fonctionnalités :
 * - CRUD complet avec pagination
 * - Recherche et filtrage
 * - Changement de mot de passe
 * - Statistiques utilisateur
 * - Protection par rôles
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
