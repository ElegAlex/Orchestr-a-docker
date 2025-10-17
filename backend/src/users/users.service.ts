import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

/**
 * Service de gestion des utilisateurs
 *
 * Fonctionnalités :
 * - CRUD complet
 * - Recherche et filtrage
 * - Pagination
 * - Changement de mot de passe
 * - Gestion des départements
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouvel utilisateur
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName, role, departmentId } =
      createUserDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Si un département est spécifié, vérifier qu'il existe
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new NotFoundException('Département non trouvé');
      }
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: (role as any) || 'CONTRIBUTOR',
        departmentId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Récupérer tous les utilisateurs avec filtrage et pagination
   */
  async findAll(filterDto: FilterUserDto) {
    const {
      search,
      role,
      departmentId,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Construction des filtres WHERE
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Calculer les paramètres de pagination
    const skip = (page - 1) * limit;

    // Exécuter les requêtes en parallèle
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            managerId: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        // Statistiques
        _count: {
          select: {
            projects: true,
            tasks: true,
            comments: true,
            leaves: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Vérifier que l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Si un département est spécifié, vérifier qu'il existe
    if (updateUserDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateUserDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException('Département non trouvé');
      }
    }

    // Mettre à jour l'utilisateur
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Supprimer un utilisateur (soft delete en désactivant)
   */
  async remove(id: string) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Désactiver l'utilisateur au lieu de le supprimer
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Utilisateur désactivé avec succès' };
  }

  /**
   * Supprimer définitivement un utilisateur (hard delete)
   * À utiliser avec précaution !
   */
  async removeHard(id: string) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Supprimer définitivement
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé définitivement' };
  }

  /**
   * Changer le mot de passe d'un utilisateur
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const { oldPassword, newPassword } = changePasswordDto;

    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    // Vérifier que le nouveau mot de passe est différent
    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l\'ancien',
      );
    }

    // Hash du nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Mot de passe changé avec succès' };
  }

  /**
   * Récupérer les statistiques d'un utilisateur
   */
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        _count: {
          select: {
            projects: true,
            tasks: true,
            comments: true,
            leaves: true,
            documents: true,
            notifications: true,
            activities: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Récupérer les tâches par statut
    const tasksByStatus = await this.prisma.task.groupBy({
      by: ['status'],
      where: { assigneeId: userId },
      _count: true,
    });

    // Récupérer les congés par statut
    const leavesByStatus = await this.prisma.leave.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      counts: user._count,
      tasksByStatus,
      leavesByStatus,
    };
  }
}
