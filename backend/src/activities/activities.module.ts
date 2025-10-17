import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module de gestion des logs d'activité
 *
 * Fournit :
 * - Création de logs d'activité
 * - Recherche et filtrage avancés
 * - Statistiques d'activité
 * - Nettoyage des vieux logs
 */
@Module({
  imports: [PrismaModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
