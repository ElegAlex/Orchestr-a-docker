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
  Request,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  /**
   * POST /api/time-entries - Créer une time entry
   */
  @Post()
  create(@Request() req, @Body() createDto: CreateTimeEntryDto) {
    return this.timeEntriesService.create(req.user.id, createDto);
  }

  /**
   * GET /api/time-entries - Liste des time entries avec filtres
   * Query params: ?userId=uuid&projectId=uuid&startDate=iso&endDate=iso&page=1&limit=50
   */
  @Get()
  findAll(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Si pas admin, forcer userId à l'utilisateur connecté
    const isAdmin = req.user.role === 'ADMIN';
    const effectiveUserId = isAdmin && userId ? userId : req.user.id;

    return this.timeEntriesService.findAll({
      userId: effectiveUserId,
      projectId,
      taskId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * GET /api/time-entries/stats - Statistiques de temps
   * Query params: ?startDate=iso&endDate=iso
   */
  @Get('stats')
  getStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntriesService.getStats(req.user.id, startDate, endDate);
  }

  /**
   * GET /api/time-entries/project/:projectId/stats - Statistiques pour un projet
   * Query params: ?startDate=iso&endDate=iso
   */
  @Get('project/:projectId/stats')
  getProjectStats(
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntriesService.getProjectStats(projectId, startDate, endDate);
  }

  /**
   * GET /api/time-entries/:id - Récupérer une time entry par ID
   */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.timeEntriesService.findOne(id, req.user.id, isAdmin);
  }

  /**
   * PATCH /api/time-entries/:id - Mettre à jour une time entry
   */
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateTimeEntryDto,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.timeEntriesService.update(id, req.user.id, updateDto, isAdmin);
  }

  /**
   * DELETE /api/time-entries/:id - Supprimer une time entry
   */
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.timeEntriesService.remove(id, req.user.id, isAdmin);
  }
}
