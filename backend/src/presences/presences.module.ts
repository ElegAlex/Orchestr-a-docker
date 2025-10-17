import { Module } from '@nestjs/common';
import { PresencesService } from './presences.service';
import { PresencesController } from './presences.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PresencesController],
  providers: [PresencesService],
  exports: [PresencesService],
})
export class PresencesModule {}
