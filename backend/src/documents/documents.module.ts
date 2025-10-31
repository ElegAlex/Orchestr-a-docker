import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { MinioService } from './minio.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module de gestion des documents
 *
 * Fournit :
 * - Upload/download de fichiers vers MinIO
 * - Gestion des métadonnées en base de données
 * - Filtrage et recherche avancés
 * - URLs de téléchargement temporaires
 * - Statistiques par projet
 */
@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, MinioService],
  exports: [DocumentsService, MinioService],
})
export class DocumentsModule {}
