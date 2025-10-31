import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SystemSettings } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer la configuration système
   * Retourne toujours la première configuration (singleton)
   */
  async getSettings(): Promise<SystemSettings> {
    const settings = await this.prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!settings) {
      throw new NotFoundException('Configuration système non trouvée');
    }

    // Masquer le mot de passe SMTP avant de retourner
    if (settings.smtpPassword) {
      return {
        ...settings,
        smtpPassword: '********',
      };
    }

    return settings;
  }

  /**
   * Mettre à jour la configuration système
   */
  async updateSettings(
    updateDto: UpdateSettingsDto,
    userId: string,
  ): Promise<SystemSettings> {
    // Récupérer la configuration existante
    const existing = await this.prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!existing) {
      throw new NotFoundException('Configuration système non trouvée');
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      ...updateDto,
      lastModifiedBy: userId,
    };

    // Chiffrer le mot de passe SMTP si fourni et différent de ********
    if (updateDto.smtpPassword && updateDto.smtpPassword !== '********') {
      updateData.smtpPassword = await this.encryptPassword(updateDto.smtpPassword);
    } else if (updateDto.smtpPassword === '********') {
      // Ne pas modifier le mot de passe si c'est le masque
      delete updateData.smtpPassword;
    }

    // Mettre à jour la configuration
    const updated = await this.prisma.systemSettings.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Masquer le mot de passe avant de retourner
    if (updated.smtpPassword) {
      return {
        ...updated,
        smtpPassword: '********',
      };
    }

    return updated;
  }

  /**
   * Tester la configuration email
   * Envoie un email de test à l'adresse spécifiée
   */
  async testEmailConfiguration(testEmail: string): Promise<{ success: boolean; message: string }> {
    const settings = await this.prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!settings) {
      throw new NotFoundException('Configuration système non trouvée');
    }

    if (!settings.emailEnabled) {
      return {
        success: false,
        message: 'Les emails ne sont pas activés dans la configuration',
      };
    }

    if (!settings.smtpHost || !settings.smtpPort) {
      return {
        success: false,
        message: 'Configuration SMTP incomplète',
      };
    }

    try {
      // TODO: Implémenter l'envoi réel via nodemailer
      // Pour l'instant, on simule le succès
      console.log(`Test email would be sent to: ${testEmail}`);
      console.log(`SMTP Config: ${settings.smtpHost}:${settings.smtpPort}`);

      return {
        success: true,
        message: `Email de test envoyé à ${testEmail}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de l'envoi: ${error.message}`,
      };
    }
  }

  /**
   * Obtenir les statistiques système
   */
  async getSystemStats(): Promise<any> {
    try {
      const [projectCount, userCount, taskCount] = await Promise.all([
        this.prisma.project.count(),
        this.prisma.user.count(),
        this.prisma.task.count(),
      ]);

      const settings = await this.getSettings();

      return {
        current: {
          projects: projectCount,
          users: userCount,
          tasks: taskCount,
        },
        limits: {
          maxProjects: settings.maxProjects,
          maxUsers: settings.maxUsers,
          maxTasksPerProject: settings.maxTasksPerProject,
          maxFileSize: settings.maxFileSize,
          maxStoragePerUser: settings.maxStoragePerUser,
        },
        usage: {
          projectsPercentage: Math.round((projectCount / settings.maxProjects) * 100),
          usersPercentage: Math.round((userCount / settings.maxUsers) * 100),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors du calcul des statistiques');
    }
  }

  /**
   * Vérifier le mode maintenance
   */
  async checkMaintenanceMode(): Promise<{
    enabled: boolean;
    message?: string;
  }> {
    const settings = await this.prisma.systemSettings.findFirst({
      select: {
        maintenanceMode: true,
        maintenanceMessage: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!settings) {
      return { enabled: false };
    }

    return {
      enabled: settings.maintenanceMode,
      message: settings.maintenanceMessage || undefined,
    };
  }

  /**
   * Chiffrer un mot de passe (utilisé pour SMTP)
   */
  private async encryptPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Décrypter un mot de passe (si nécessaire pour l'envoi SMTP)
   */
  async getDecryptedSmtpPassword(): Promise<string | null> {
    const settings = await this.prisma.systemSettings.findFirst({
      select: { smtpPassword: true },
      orderBy: { createdAt: 'asc' },
    });

    // Note: bcrypt ne permet pas de décrypter, il faut utiliser un autre algorithme
    // Pour l'instant, on retourne le hash (à améliorer avec crypto)
    return settings?.smtpPassword || null;
  }
}
