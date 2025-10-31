import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetDepartmentFilter } from '../auth/decorators/department-filter.decorator';

/**
 * Contrôleur de gestion des utilisateurs
 *
 * Routes disponibles :
 * - GET    /api/users           : Liste paginée avec filtres
 * - GET    /api/users/:id       : Détails d'un utilisateur
 * - GET    /api/users/:id/stats : Statistiques d'un utilisateur
 * - POST   /api/users           : Créer un utilisateur (ADMIN)
 * - PATCH  /api/users/:id       : Modifier un utilisateur
 * - DELETE /api/users/:id       : Désactiver un utilisateur (ADMIN)
 * - POST   /api/users/change-password : Changer son mot de passe
 */
@ApiTags('Utilisateurs')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Créer un nouvel utilisateur
   * Réservé aux ADMIN et RESPONSABLE
   */
  @Post()
  @Roles('ADMIN', 'RESPONSABLE')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Dupont',
        role: 'CONTRIBUTOR',
        isActive: true,
        departmentId: null,
        department: null,
        createdAt: '2025-10-11T14:30:00.000Z',
        updatedAt: '2025-10-11T14:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Récupérer tous les utilisateurs avec filtres et pagination
   * 🔒 Isolation par département : Les utilisateurs non-ADMIN/RESPONSABLE
   * ne voient que les users de leur département
   */
  @Get()
  @ApiOperation({ summary: 'Liste des utilisateurs avec filtres et pagination' })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'alex@example.com',
            firstName: 'Alex',
            lastName: 'Dupont',
            role: 'CONTRIBUTOR',
            isActive: true,
            departmentId: null,
            department: null,
            createdAt: '2025-10-11T14:30:00.000Z',
            updatedAt: '2025-10-11T14:30:00.000Z',
            lastLoginAt: '2025-10-11T14:30:00.000Z',
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5,
        },
      },
    },
  })
  findAll(
    @Query() filterDto: FilterUserDto,
    @GetDepartmentFilter() departmentFilter: string | null,
  ) {
    // 🔒 Si l'utilisateur n'est pas ADMIN/RESPONSABLE, on force le filtre département
    if (departmentFilter && !filterDto.departmentId) {
      filterDto.departmentId = departmentFilter;
    }
    return this.usersService.findAll(filterDto);
  }

  /**
   * Récupérer un utilisateur par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Détails de l\'utilisateur',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Récupérer les statistiques d'un utilisateur
   */
  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques de l\'utilisateur',
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Dupont',
          role: 'CONTRIBUTOR',
        },
        counts: {
          projects: 5,
          tasks: 23,
          comments: 45,
          leaves: 3,
          documents: 12,
          notifications: 89,
          activities: 234,
        },
        tasksByStatus: [
          { status: 'TODO', _count: 5 },
          { status: 'IN_PROGRESS', _count: 3 },
          { status: 'COMPLETED', _count: 15 },
        ],
        leavesByStatus: [
          { status: 'PENDING', _count: 1 },
          { status: 'APPROVED', _count: 2 },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  /**
   * Mettre à jour un utilisateur
   * Les utilisateurs peuvent se modifier eux-mêmes (sauf le rôle)
   * Les ADMIN peuvent modifier n'importe qui
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur modifié avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    // TODO: Vérifier que l'utilisateur modifie son propre profil
    // ou qu'il est ADMIN
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Désactiver un utilisateur (soft delete)
   * Réservé aux ADMIN
   */
  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur désactivé avec succès',
    schema: {
      example: {
        message: 'Utilisateur désactivé avec succès',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Supprimer définitivement un utilisateur (hard delete)
   * Réservé aux ADMIN et RESPONSABLE - À utiliser avec précaution !
   */
  @Delete(':id/permanent')
  @Roles('ADMIN', 'RESPONSABLE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer définitivement un utilisateur (hard delete)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur supprimé définitivement',
    schema: {
      example: {
        message: 'Utilisateur supprimé définitivement',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  removeHard(@Param('id') id: string) {
    return this.usersService.removeHard(id);
  }

  /**
   * Changer son mot de passe
   * Accessible à tous les utilisateurs authentifiés
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Changer son mot de passe' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe changé avec succès',
    schema: {
      example: {
        message: 'Mot de passe changé avec succès',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Ancien mot de passe incorrect' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur (Admin only)
   * Permet à un administrateur de changer le password d'un utilisateur sans connaître l'ancien
   */
  @Post('admin-reset-password')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe d\'un utilisateur (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
    schema: {
      example: {
        message: 'Mot de passe réinitialisé avec succès',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com'
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Accès refusé (Admin seulement)' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  adminResetPassword(
    @Body() adminResetPasswordDto: AdminResetPasswordDto,
  ) {
    return this.usersService.adminResetPassword(
      adminResetPasswordDto.userId,
      adminResetPasswordDto.newPassword
    );
  }
}
