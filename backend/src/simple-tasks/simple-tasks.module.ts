import { Module } from '@nestjs/common';
import { SimpleTasksService } from './simple-tasks.service';
import { SimpleTasksController } from './simple-tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SimpleTasksController],
  providers: [SimpleTasksService],
  exports: [SimpleTasksService],
})
export class SimpleTasksModule {}
