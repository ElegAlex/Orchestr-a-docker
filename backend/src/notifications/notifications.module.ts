import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module de gestion des notifications
 *
 * Fournit :
 * - CRUD complet des notifications
 * - Marquage lu/non-lu
 * - Filtrage et recherche avancés
 * - Suppression en masse
 * - Compteur de notifications non lues
 */
@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
