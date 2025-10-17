import { Module } from '@nestjs/common';
import { PersonalTodosService } from './personal-todos.service';
import { PersonalTodosController } from './personal-todos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalTodosController],
  providers: [PersonalTodosService],
  exports: [PersonalTodosService],
})
export class PersonalTodosModule {}
