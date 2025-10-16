import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Contrôleur de gestion des notifications
 *
 * Toutes les routes nécessitent une authentification JWT
 * Création réservée aux ADMIN
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Créer une nouvelle notification
   * Rôles autorisés: ADMIN (création système)
   */
  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Créer une notification',
    description:
      'Crée une nouvelle notification système. Réservé aux ADMIN.',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification créée avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  /**
   * Récupérer toutes les notifications avec filtrage et pagination
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les notifications',
    description:
      'Liste toutes les notifications avec possibilité de filtrage et pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des notifications récupérée avec succès',
  })
  findAll(@Query() filterDto: FilterNotificationDto) {
    return this.notificationsService.findAll(filterDto);
  }

  /**
   * Récupérer le nombre de notifications non lues
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get('unread/count')
  @ApiOperation({
    summary: 'Nombre de notifications non lues',
    description: 'Récupère le nombre de notifications non lues de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Nombre récupéré avec succès',
  })
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  /**
   * Récupérer une notification par ID
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une notification',
    description: 'Récupère les détails d\'une notification par son ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la notification',
    example: 'uuid-de-la-notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification récupérée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification non trouvée',
  })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  /**
   * Marquer une notification comme lue
   * L'utilisateur peut marquer ses propres notifications, ADMIN peut tout marquer
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer une notification comme lue',
    description:
      'Marque une notification comme lue. Réservé au destinataire ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la notification',
    example: 'uuid-de-la-notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marquée comme lue',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification non trouvée',
  })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(
      id,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Marquer une notification comme non lue
   * L'utilisateur peut marquer ses propres notifications, ADMIN peut tout marquer
   */
  @Patch(':id/unread')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer une notification comme non lue',
    description:
      'Marque une notification comme non lue. Réservé au destinataire ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la notification',
    example: 'uuid-de-la-notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marquée comme non lue',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification non trouvée',
  })
  markAsUnread(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsUnread(
      id,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Marquer toutes les notifications comme lues
   * Accessible à tous les utilisateurs authentifiés
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer toutes les notifications comme lues',
    description:
      'Marque toutes les notifications non lues de l\'utilisateur connecté comme lues',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications marquées comme lues',
  })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  /**
   * Supprimer une notification
   * L'utilisateur peut supprimer ses propres notifications, ADMIN peut tout supprimer
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une notification',
    description: 'Supprime une notification. Réservé au destinataire ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la notification',
    example: 'uuid-de-la-notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification supprimée avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification non trouvée',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.id, req.user.role);
  }

  /**
   * Supprimer toutes les notifications lues
   * Accessible à tous les utilisateurs authentifiés
   */
  @Delete('read/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer toutes les notifications lues',
    description:
      'Supprime toutes les notifications lues de l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications supprimées avec succès',
  })
  removeAllRead(@Request() req) {
    return this.notificationsService.removeAllRead(req.user.id);
  }
}
