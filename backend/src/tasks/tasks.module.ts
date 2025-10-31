import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommentsModule } from '../comments/comments.module';

/**
 * Module de gestion des tâches
 *
 * Fournit :
 * - CRUD complet des tâches
 * - Filtrage et recherche avancés
 * - Gestion des assignations
 * - Validation des dépendances
 * - Statistiques par projet
 * - Commentaires sur tâches
 */
@Module({
  imports: [PrismaModule, CommentsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
