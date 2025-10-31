import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module Prisma global
 *
 * @Global() rend ce module disponible partout sans import explicite
 * Utile pour éviter d'importer PrismaModule dans chaque module
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
