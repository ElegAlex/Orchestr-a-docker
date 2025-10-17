import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère le profil de l'utilisateur connecté
   */
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        phoneNumber: true,
        jobTitle: true,
        bio: true,
        preferences: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastActivityAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Met à jour le profil de l'utilisateur
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateProfileDto,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        phoneNumber: true,
        jobTitle: true,
        bio: true,
        preferences: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Change le mot de passe de l'utilisateur
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    return { message: 'Mot de passe changé avec succès' };
  }

  /**
   * Supprime l'avatar de l'utilisateur
   */
  async deleteAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Mettre à jour l'utilisateur pour supprimer l'avatar
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    return updatedUser;
  }

  /**
   * Récupère les statistiques du profil utilisateur
   */
  async getProfileStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Compter les projets actifs (via ProjectMember)
    const activeProjects = await this.prisma.projectMember.count({
      where: {
        userId,
        project: {
          status: 'ACTIVE',
        },
      },
    });

    // Compter les projets terminés
    const completedProjects = await this.prisma.projectMember.count({
      where: {
        userId,
        project: {
          status: 'COMPLETED',
        },
      },
    });

    // Compter les tâches terminées
    const completedTasks = await this.prisma.task.count({
      where: {
        assigneeId: userId,
        status: 'COMPLETED',
      },
    });

    // Compter toutes les tâches assignées
    const totalTasks = await this.prisma.task.count({
      where: {
        assigneeId: userId,
      },
    });

    // Calculer le temps total passé (via TimeEntry)
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
      },
      select: {
        duration: true,
      },
    });

    const totalTimeSpent = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);

    // Calculer le taux de complétion des tâches
    const averageTaskCompletion = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Calculer les tâches des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTasks = await this.prisma.task.count({
      where: {
        assigneeId: userId,
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const recentCompletedTasks = await this.prisma.task.count({
      where: {
        assigneeId: userId,
        status: 'COMPLETED',
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      activeProjects,
      completedProjects,
      completedTasks,
      totalTasks,
      totalTimeSpent, // en minutes
      totalTimeSpentHours: Math.round(totalTimeSpent / 60 * 10) / 10, // en heures (arrondi 1 décimale)
      averageTaskCompletion,
      recentTasks,
      recentCompletedTasks,
      recentCompletionRate: recentTasks > 0
        ? Math.round((recentCompletedTasks / recentTasks) * 100)
        : 0,
    };
  }
}
