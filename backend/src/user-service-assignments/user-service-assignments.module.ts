import { Module } from '@nestjs/common';
import { UserServiceAssignmentsService } from './user-service-assignments.service';
import { UserServiceAssignmentsController } from './user-service-assignments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserServiceAssignmentsController],
  providers: [UserServiceAssignmentsService],
  exports: [UserServiceAssignmentsService],
})
export class UserServiceAssignmentsModule {}
