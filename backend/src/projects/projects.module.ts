import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

/**
 * Module de gestion des projets
 *
 * Fonctionnalités :
 * - CRUD complet
 * - Gestion des membres
 * - Recherche et filtrage
 * - Statistiques
 */
@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
