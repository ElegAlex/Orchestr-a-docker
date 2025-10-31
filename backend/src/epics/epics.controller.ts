import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EpicsService } from './epics.service';
import { CreateEpicDto } from './dto/create-epic.dto';
import {
  UpdateEpicDto,
  UpdateEpicProgressDto,
  UpdateEpicStatusDto,
} from './dto/update-epic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('epics')
@UseGuards(JwtAuthGuard)
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  /**
   * POST /api/epics - Créer un epic
   */
  @Post()
  create(@Body() createDto: CreateEpicDto) {
    return this.epicsService.create(createDto);
  }

  /**
   * GET /api/epics - Liste paginée des epics
   * Query params: ?page=1&limit=10&projectId=uuid
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.epicsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      projectId,
    });
  }

  /**
   * GET /api/epics/project/:projectId - Epics d'un projet
   */
  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.epicsService.findByProject(projectId);
  }

  /**
   * GET /api/epics/:id - Récupérer un epic par ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.epicsService.findOne(id);
  }

  /**
   * GET /api/epics/:id/tasks - Tâches associées à un epic
   */
  @Get(':id/tasks')
  findEpicTasks(@Param('id') id: string) {
    return this.epicsService.findEpicTasks(id);
  }

  /**
   * PATCH /api/epics/:id - Mettre à jour un epic
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEpicDto) {
    return this.epicsService.update(id, updateDto);
  }

  /**
   * PATCH /api/epics/:id/progress - Mettre à jour la progression
   */
  @Patch(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() progressDto: UpdateEpicProgressDto,
  ) {
    return this.epicsService.updateProgress(id, progressDto);
  }

  /**
   * PATCH /api/epics/:id/status - Mettre à jour le statut
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateEpicStatusDto,
  ) {
    return this.epicsService.updateStatus(id, statusDto);
  }

  /**
   * DELETE /api/epics/:id - Supprimer un epic
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.epicsService.remove(id);
  }
}
