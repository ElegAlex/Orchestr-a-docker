import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetDepartmentFilter } from '../auth/decorators/department-filter.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CommentsService } from '../comments/comments.service';
import { FilterCommentDto } from '../comments/dto/filter-comment.dto';

/**
 * Contrôleur de gestion des tâches
 *
 * Toutes les routes nécessitent une authentification JWT
 * Certaines routes sont restreintes par rôle
 */
@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly commentsService: CommentsService,
  ) {}

  /**
   * Créer une nouvelle tâche
   * Rôles autorisés : ADMIN, RESPONSABLE, MANAGER, TEAM_LEAD
   */
  @Post()
  @Roles(Role.ADMIN, Role.RESPONSABLE, Role.MANAGER, Role.TEAM_LEAD)
  @ApiOperation({
    summary: 'Créer une nouvelle tâche',
    description:
      'Crée une nouvelle tâche dans un projet. Réservé aux gestionnaires.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tâche créée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Projet ou utilisateur non trouvé',
  })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  /**
   * Récupérer toutes les tâches avec filtrage et pagination
   * 🔒 Isolation par département : Les utilisateurs non-ADMIN/RESPONSABLE
   * ne voient que les tâches assignées à leur département
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les tâches',
    description:
      'Liste toutes les tâches avec possibilité de filtrage et pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des tâches récupérée avec succès',
  })
  findAll(
    @Query() filterDto: FilterTaskDto,
    @GetDepartmentFilter() departmentFilter: string | null,
  ) {
    // 🔒 Si l'utilisateur n'est pas ADMIN/RESPONSABLE, on force le filtre département
    if (departmentFilter && !filterDto.departmentId) {
      filterDto.departmentId = departmentFilter;
    }
    return this.tasksService.findAll(filterDto);
  }

  /**
   * Récupérer les statistiques des tâches d'un projet
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get('project/:projectId/stats')
  @ApiOperation({
    summary: 'Statistiques des tâches d\'un projet',
    description:
      'Récupère les statistiques par statut, priorité, et heures pour un projet',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID du projet',
    example: 'b387b5f3-6c78-440f-b500-f17776a177af',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Projet non trouvé',
  })
  getProjectTaskStats(@Param('projectId') projectId: string) {
    return this.tasksService.getProjectTaskStats(projectId);
  }

  /**
   * Récupérer les tâches assignées à un utilisateur
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Tâches assignées à un utilisateur',
    description: 'Récupère toutes les tâches assignées à un utilisateur',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: '502bce39-ae6c-4423-9a07-72dd93c5c544',
  })
  @ApiResponse({
    status: 200,
    description: 'Tâches récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getUserTasks(
    @Param('userId') userId: string,
    @Query() filterDto: FilterTaskDto,
  ) {
    return this.tasksService.getUserTasks(userId, filterDto);
  }

  /**
   * Récupérer une tâche par ID
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une tâche',
    description: 'Récupère les détails complets d\'une tâche par son ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tâche',
    example: 'uuid-de-la-tache',
  })
  @ApiResponse({
    status: 200,
    description: 'Tâche récupérée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  /**
   * Mettre à jour une tâche
   * BUG-06 FIX: Accessible aux membres de l'équipe projet, assignés, ou gestionnaires
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Mettre à jour une tâche',
    description: 'Met à jour les informations d\'une tâche. Accessible aux membres de l\'équipe projet, à l\'assigné, ou aux gestionnaires.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tâche',
    example: 'uuid-de-la-tache',
  })
  @ApiResponse({
    status: 200,
    description: 'Tâche mise à jour avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : vous devez être membre de l\'équipe projet',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.tasksService.update(id, updateTaskDto, currentUserId);
  }

  /**
   * Supprimer une tâche
   * Rôles autorisés : ADMIN, RESPONSABLE, MANAGER
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.RESPONSABLE, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une tâche',
    description:
      'Supprime une tâche. Impossible si d\'autres tâches en dépendent.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tâche',
    example: 'uuid-de-la-tache',
  })
  @ApiResponse({
    status: 200,
    description: 'Tâche supprimée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer : d\'autres tâches en dépendent',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  /**
   * Récupérer les commentaires d'une tâche
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id/comments')
  @ApiOperation({
    summary: 'Récupérer les commentaires d\'une tâche',
    description: 'Liste tous les commentaires d\'une tâche avec pagination',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tâche',
    example: 'uuid-de-la-tache',
  })
  @ApiResponse({
    status: 200,
    description: 'Commentaires récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  getTaskComments(
    @Param('id') id: string,
    @Query() filterDto: FilterCommentDto,
  ) {
    return this.commentsService.getTaskComments(id, filterDto);
  }
}
