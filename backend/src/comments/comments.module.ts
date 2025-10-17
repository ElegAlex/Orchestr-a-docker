import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module de gestion des commentaires
 *
 * Fournit :
 * - CRUD complet des commentaires
 * - Filtrage et recherche avancés
 * - Pagination
 * - Permissions (auteur ou ADMIN)
 */
@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
