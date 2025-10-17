import { Module } from '@nestjs/common';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module de gestion des congés
 *
 * Fournit :
 * - CRUD complet des demandes de congés
 * - Workflow d'approbation/rejet/annulation
 * - Filtrage et recherche avancés
 * - Validation des dates et chevauchements
 * - Statistiques par utilisateur
 */
@Module({
  imports: [PrismaModule],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
