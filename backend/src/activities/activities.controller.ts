import {
  Controller,
  Get,
  Post,
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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { FilterActivityDto } from './dto/filter-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Contrôleur de gestion des logs d'activité
 *
 * Toutes les routes nécessitent une authentification JWT
 * Création et suppression réservées aux ADMIN
 */
@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Créer une nouvelle activité (log)
   * Rôles autorisés: ADMIN (création système)
   */
  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Créer un log d\'activité',
    description:
      'Crée une nouvelle entrée de log d\'activité. Réservé aux ADMIN.',
  })
  @ApiResponse({
    status: 201,
    description: 'Activité créée avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  /**
   * Récupérer toutes les activités avec filtrage et pagination
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les activités',
    description:
      'Liste toutes les activités avec possibilité de filtrage et pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des activités récupérée avec succès',
  })
  findAll(@Query() filterDto: FilterActivityDto) {
    return this.activitiesService.findAll(filterDto);
  }

  /**
   * Récupérer les statistiques d'activité
   * Rôles autorisés: ADMIN, RESPONSABLE
   */
  @Get('stats')
  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @ApiOperation({
    summary: 'Statistiques d\'activité',
    description:
      'Récupère les statistiques globales d\'activité (par statut, action, utilisateur)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  getStats() {
    return this.activitiesService.getStats();
  }

  /**
   * Récupérer une activité par ID
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une activité',
    description: 'Récupère les détails d\'une activité par son ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'activité',
    example: 'uuid-de-l-activite',
  })
  @ApiResponse({
    status: 200,
    description: 'Activité récupérée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Activité non trouvée',
  })
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  /**
   * Supprimer une activité
   * Rôles autorisés: ADMIN
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une activité',
    description: 'Supprime un log d\'activité. Réservé aux ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'activité',
    example: 'uuid-de-l-activite',
  })
  @ApiResponse({
    status: 200,
    description: 'Activité supprimée avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Activité non trouvée',
  })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

  /**
   * Supprimer toutes les activités
   * Rôles autorisés: ADMIN
   */
  @Delete()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer toutes les activités',
    description:
      'Supprime tous les logs d\'activité. Réservé aux ADMIN. Utile pour nettoyer les vieux logs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Activités supprimées avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  removeAll() {
    return this.activitiesService.removeAll();
  }
}
