import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service Prisma pour gérer la connexion à la base de données
 *
 * Ce service :
 * - Établit la connexion à PostgreSQL au démarrage du module
 * - Ferme proprement la connexion à l'arrêt
 * - Est injectable partout dans l'application
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Appelé au démarrage du module
   * Établit la connexion à la base de données
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to PostgreSQL');
  }

  /**
   * Appelé à l'arrêt du module
   * Ferme proprement la connexion
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Prisma disconnected from PostgreSQL');
  }
}
