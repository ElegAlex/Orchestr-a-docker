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
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import {
  UpdateMilestoneDto,
  ValidateMilestoneDto,
  UpdateStatusDto,
} from './dto/update-milestone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  /**
   * GET /api/milestones - Récupérer tous les milestones (avec pagination)
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.milestonesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      projectId,
    });
  }

  /**
   * POST /api/milestones - Créer un milestone
   */
  @Post()
  create(@Body() createMilestoneDto: CreateMilestoneDto) {
    return this.milestonesService.create(createMilestoneDto);
  }

  /**
   * GET /api/milestones/project/:projectId - Récupérer tous les milestones d'un projet
   */
  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.milestonesService.findByProject(projectId);
  }

  /**
   * GET /api/milestones/project/:projectId/status/:status - Récupérer par statut
   */
  @Get('project/:projectId/status/:status')
  findByProjectAndStatus(
    @Param('projectId') projectId: string,
    @Param('status') status: any,
  ) {
    return this.milestonesService.findByProjectAndStatus(projectId, status);
  }

  /**
   * GET /api/milestones/project/:projectId/at-risk - Récupérer milestones à risque
   */
  @Get('project/:projectId/at-risk')
  findAtRisk(@Param('projectId') projectId: string) {
    return this.milestonesService.findAtRisk(projectId);
  }

  /**
   * GET /api/milestones/project/:projectId/upcoming - Récupérer milestones à venir
   */
  @Get('project/:projectId/upcoming')
  findUpcoming(
    @Param('projectId') projectId: string,
    @Query('days') days?: string,
  ) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.milestonesService.findUpcoming(projectId, daysNumber);
  }

  /**
   * GET /api/milestones/project/:projectId/metrics - Calculer métriques
   */
  @Get('project/:projectId/metrics')
  getProjectMetrics(@Param('projectId') projectId: string) {
    return this.milestonesService.getProjectMetrics(projectId);
  }

  /**
   * GET /api/milestones/:id - Récupérer un milestone par ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.milestonesService.findOne(id);
  }

  /**
   * PATCH /api/milestones/:id - Mettre à jour un milestone
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    return this.milestonesService.update(id, updateMilestoneDto);
  }

  /**
   * PATCH /api/milestones/:id/status - Mettre à jour le statut
   */
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.milestonesService.updateStatus(id, body.status);
  }

  /**
   * POST /api/milestones/:id/validate - Valider un milestone
   */
  @Post(':id/validate')
  validate(
    @Param('id') id: string,
    @Body() body: ValidateMilestoneDto & { validatorId: string },
  ) {
    return this.milestonesService.validate(
      id,
      body.validatorId,
      body.validationNotes,
    );
  }

  /**
   * DELETE /api/milestones/:id - Supprimer un milestone
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.milestonesService.remove(id);
  }
}
