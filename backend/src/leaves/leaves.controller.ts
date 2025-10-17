import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
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
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { FilterLeaveDto } from './dto/filter-leave.dto';
import { RejectLeaveDto } from './dto/reject-leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Contrôleur de gestion des demandes de congés
 *
 * Toutes les routes nécessitent une authentification JWT
 * Workflow d'approbation réservé aux rôles: ADMIN, RESPONSABLE, MANAGER
 */
@ApiTags('leaves')
@ApiBearerAuth()
@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  /**
   * Créer une nouvelle demande de congé
   * Accessible à tous les utilisateurs authentifiés
   */
  @Post()
  @ApiOperation({
    summary: 'Créer une demande de congé',
    description: 'Crée une nouvelle demande de congé pour l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 201,
    description: 'Demande créée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou chevauchement détecté',
  })
  create(@Body() createLeaveDto: CreateLeaveDto, @Request() req) {
    return this.leavesService.create(createLeaveDto, req.user.id);
  }

  /**
   * Récupérer toutes les demandes de congé avec filtrage et pagination
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les demandes de congé',
    description:
      'Liste toutes les demandes de congé avec possibilité de filtrage et pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des demandes récupérée avec succès',
  })
  findAll(@Query() filterDto: FilterLeaveDto) {
    return this.leavesService.findAll(filterDto);
  }

  /**
   * Récupérer les statistiques de congés d'un utilisateur
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get('user/:userId/stats')
  @ApiOperation({
    summary: 'Statistiques de congés d\'un utilisateur',
    description:
      'Récupère les statistiques par statut et type pour un utilisateur',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: '502bce39-ae6c-4423-9a07-72dd93c5c544',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getUserLeaveStats(@Param('userId') userId: string) {
    return this.leavesService.getUserLeaveStats(userId);
  }

  /**
   * Récupérer une demande par ID
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une demande de congé',
    description: 'Récupère les détails d\'une demande par son ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la demande',
    example: 'uuid-de-la-demande',
  })
  @ApiResponse({
    status: 200,
    description: 'Demande récupérée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Demande non trouvée',
  })
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(id);
  }

  /**
   * Mettre à jour une demande de congé
   * L'utilisateur peut modifier ses propres demandes PENDING, ADMIN peut tout modifier
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une demande de congé',
    description:
      'Met à jour une demande de congé. Uniquement pour les demandes PENDING.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la demande',
    example: 'uuid-de-la-demande',
  })
  @ApiResponse({
    status: 200,
    description: 'Demande mise à jour avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou demande non modifiable',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé',
  })
  @ApiResponse({
    status: 404,
    description: 'Demande non trouvée',
  })
  update(
    @Param('id') id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
    @Request() req,
  ) {
    return this.leavesService.update(
      id,
      updateLeaveDto,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Supprimer une demande de congé
   * L'utilisateur peut supprimer ses propres demandes PENDING, ADMIN peut tout supprimer
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une demande de congé',
    description: 'Supprime une demande. Uniquement pour les demandes PENDING.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la demande',
    example: 'uuid-de-la-demande',
  })
  @ApiResponse({
    status: 200,
    description: 'Demande supprimée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Demande non supprimable',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé',
  })
  @ApiResponse({
    status: 404,
    description: 'Demande non trouvée',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.leavesService.remove(id, req.user.id, req.user.role);
  }

  /**
   * Approuver une demande de congé
   * Rôles autorisés: ADMIN, RESPONSABLE, MANAGER
   */
  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.RESPONSABLE, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approuver une demande de congé',
    description:
      'Approuve une demande de congé en attente. Réservé aux gestionnaires.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la demande',
    example: 'uuid-de-la-demande',
  })
  @ApiResponse({
    status: 200,
    description: 'Demande approuvée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Demande non approuvable',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Demande non trouvée',
  })
  approve(@Param('id') id: string, @Request() req) {
    return this.leavesService.approve(id, req.user.id);
  }

  /**
   * Rejeter une demande de congé
   * Rôles autorisés: ADMIN, RESPONSABLE, MANAGER
   */
  @Post(':id/reject')
  @Roles(Role.ADMIN, Role.RESPONSABLE, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rejeter une demande de congé',
    description:
      'Rejette une demande de congé en attente. Réservé aux gestionnaires.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la demande',
    example: 'uuid-de-la-demande',
  })
  @ApiResponse({
    status: 200,
    description: 'Demande rejetée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Demande non rejectable',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Demande non trouvée',
  })
  reject(
    @Param('id') id: string,
    @Body() rejectLeaveDto: RejectLeaveDto,
    @Request() req,
  ) {
    return this.leavesService.reject(id, rejectLeaveDto, req.user.id);
  }

  /**
   * Annuler une demande de congé approuvée
   * Rôles autorisés: ADMIN, RESPONSABLE
   */
  @Post(':id/cancel')
  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Annuler une demande de congé approuvée',
    description:
      'Annule une demande déjà approuvée. Réservé aux ADMIN et RESPONSABLE.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la demande',
    example: 'uuid-de-la-demande',
  })
  @ApiResponse({
    status: 200,
    description: 'Demande annulée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Demande non annulable',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Demande non trouvée',
  })
  cancel(@Param('id') id: string, @Request() req) {
    return this.leavesService.cancel(id, req.user.id);
  }
}
