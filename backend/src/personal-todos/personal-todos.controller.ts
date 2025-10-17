import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PersonalTodosService } from './personal-todos.service';
import { CreatePersonalTodoDto } from './dto/create-personal-todo.dto';
import { UpdatePersonalTodoDto } from './dto/update-personal-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('personal-todos')
@UseGuards(JwtAuthGuard)
export class PersonalTodosController {
  constructor(private readonly personalTodosService: PersonalTodosService) {}

  /**
   * POST /api/personal-todos - Créer une todo
   */
  @Post()
  create(@Request() req, @Body() createDto: CreatePersonalTodoDto) {
    return this.personalTodosService.create(req.user.id, createDto);
  }

  /**
   * GET /api/personal-todos - Récupérer toutes les todos de l'utilisateur
   * Query params: ?completed=true|false
   */
  @Get()
  findAll(@Request() req, @Query('completed') completed?: string) {
    const completedBool =
      completed === 'true' ? true : completed === 'false' ? false : undefined;
    return this.personalTodosService.findByUser(req.user.id, completedBool);
  }

  /**
   * GET /api/personal-todos/:id - Récupérer une todo par ID
   */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.personalTodosService.findOne(id, req.user.id);
  }

  /**
   * PATCH /api/personal-todos/:id - Mettre à jour une todo
   */
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdatePersonalTodoDto,
  ) {
    return this.personalTodosService.update(id, req.user.id, updateDto);
  }

  /**
   * PATCH /api/personal-todos/:id/toggle - Toggle completed status
   */
  @Patch(':id/toggle')
  toggle(@Request() req, @Param('id') id: string) {
    return this.personalTodosService.toggle(id, req.user.id);
  }

  /**
   * DELETE /api/personal-todos/:id - Supprimer une todo
   */
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.personalTodosService.remove(id, req.user.id);
  }

  /**
   * DELETE /api/personal-todos/completed/all - Supprimer toutes les todos complétées
   */
  @Delete('completed/all')
  removeCompleted(@Request() req) {
    return this.personalTodosService.removeCompleted(req.user.id);
  }
}
