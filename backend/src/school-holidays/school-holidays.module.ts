import { Module } from '@nestjs/common';
import { SchoolHolidaysService } from './school-holidays.service';
import { SchoolHolidaysController } from './school-holidays.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolHolidaysController],
  providers: [SchoolHolidaysService],
  exports: [SchoolHolidaysService],
})
export class SchoolHolidaysModule {}
