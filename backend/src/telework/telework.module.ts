import { Module } from '@nestjs/common';
import { TeleworkController } from './telework.controller';
import { TeleworkService } from './telework.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeleworkController],
  providers: [TeleworkService],
  exports: [TeleworkService],
})
export class TeleworkModule {}
