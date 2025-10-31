import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { AttachmentStatsDto } from './dto/attachment-stats.dto';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class AttachmentsService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialiser MinIO client
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get<string>('MINIO_PORT') || '9000'),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
    });

    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'orchestr-a-files';
    this.ensureBucketExists();
  }

  /**
   * Assurer que le bucket MinIO existe
   */
  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ Bucket MinIO '${this.bucketName}' créé avec succès`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du bucket MinIO:', error);
    }
  }

  /**
   * Upload un fichier vers MinIO et créer l'entrée DB
   */
  async uploadFile(
    file: Express.Multer.File,
    dto: CreateAttachmentDto,
    userId: string,
  ) {
    try {
      // Validation de la taille (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new BadRequestException('Le fichier est trop volumineux (max: 50MB)');
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const randomId = randomUUID();
      const extension = file.originalname.split('.').pop() || '';
      const fileName = `${timestamp}_${randomId}.${extension}`;

      // Déterminer le chemin de stockage
      let storagePath: string;
      if (dto.taskId) {
        storagePath = `attachments/tasks/${dto.taskId}/${fileName}`;
      } else if (dto.projectId) {
        storagePath = `attachments/projects/${dto.projectId}/${fileName}`;
      } else {
        storagePath = `attachments/general/${fileName}`;
      }

      // Upload vers MinIO
      await this.minioClient.putObject(
        this.bucketName,
        storagePath,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'Original-Name': encodeURIComponent(file.originalname),
        },
      );

      // Créer l'entrée en base de données
      const attachment = await this.prisma.attachment.create({
        data: {
          fileName,
          originalName: dto.originalName || file.originalname,
          fileSize: BigInt(file.size),
          mimeType: dto.mimeType || file.mimetype,
          storagePath,
          downloadUrl: null, // Généré à la demande
          taskId: dto.taskId,
          projectId: dto.projectId,
          uploadedBy: userId,
          description: dto.description,
          tags: dto.tags || [],
          isPublic: dto.isPublic || false,
          version: 1,
        },
      });

      // Convertir BigInt en string pour JSON
      return {
        ...attachment,
        fileSize: attachment.fileSize.toString(),
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw new InternalServerErrorException('Erreur lors de l\'upload du fichier');
    }
  }

  /**
   * Récupérer toutes les pièces jointes d'une tâche
   */
  async getTaskAttachments(taskId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { uploadedAt: 'desc' },
    });

    return attachments.map((att) => ({
      ...att,
      fileSize: att.fileSize.toString(),
    }));
  }

  /**
   * Récupérer toutes les pièces jointes d'un projet
   */
  async getProjectAttachments(projectId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' },
    });

    return attachments.map((att) => ({
      ...att,
      fileSize: att.fileSize.toString(),
    }));
  }

  /**
   * Récupérer une pièce jointe par ID
   */
  async getAttachment(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Pièce jointe ${id} non trouvée`);
    }

    return {
      ...attachment,
      fileSize: attachment.fileSize.toString(),
    };
  }

  /**
   * Générer une URL de téléchargement signée (valide 7 jours)
   */
  async getDownloadUrl(id: string): Promise<string> {
    const attachment = await this.getAttachment(id);

    try {
      // Générer une URL signée valide 7 jours (604800 secondes)
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        attachment.storagePath,
        7 * 24 * 60 * 60, // 7 jours
      );

      return url;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL:', error);
      throw new InternalServerErrorException('Erreur lors de la génération de l\'URL de téléchargement');
    }
  }

  /**
   * Télécharger le fichier (stream)
   */
  async downloadFile(id: string) {
    const attachment = await this.getAttachment(id);

    try {
      const stream = await this.minioClient.getObject(this.bucketName, attachment.storagePath);

      return {
        stream,
        filename: attachment.originalName,
        mimeType: attachment.mimeType,
      };
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw new InternalServerErrorException('Erreur lors du téléchargement du fichier');
    }
  }

  /**
   * Mettre à jour les métadonnées d'une pièce jointe
   */
  async updateAttachment(id: string, dto: UpdateAttachmentDto) {
    await this.getAttachment(id); // Vérifier l'existence

    const updated = await this.prisma.attachment.update({
      where: { id },
      data: {
        description: dto.description,
        tags: dto.tags,
        isPublic: dto.isPublic,
      },
    });

    return {
      ...updated,
      fileSize: updated.fileSize.toString(),
    };
  }

  /**
   * Supprimer une pièce jointe (fichier + DB)
   */
  async deleteAttachment(id: string) {
    const attachment = await this.getAttachment(id);

    try {
      // Supprimer le fichier de MinIO
      await this.minioClient.removeObject(this.bucketName, attachment.storagePath);
    } catch (error) {
      console.warn('Fichier déjà supprimé de MinIO ou introuvable:', error.message);
    }

    // Supprimer l'entrée de la base de données
    await this.prisma.attachment.delete({
      where: { id },
    });

    return { message: 'Pièce jointe supprimée avec succès' };
  }

  /**
   * Obtenir les statistiques des pièces jointes d'une tâche
   */
  async getTaskAttachmentStats(taskId: string): Promise<AttachmentStatsDto> {
    const attachments = await this.prisma.attachment.findMany({
      where: { taskId },
    });

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats: AttachmentStatsDto = {
      totalFiles: attachments.length,
      totalSize: attachments.reduce((sum, att) => sum + Number(att.fileSize), 0),
      fileTypes: {},
      recentUploads: 0,
    };

    attachments.forEach((att) => {
      // Compter les types de fichiers
      const extension = att.originalName.split('.').pop()?.toLowerCase() || 'unknown';
      stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;

      // Compter les uploads récents
      if (att.uploadedAt > yesterday) {
        stats.recentUploads++;
      }
    });

    return stats;
  }

  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats(): Promise<AttachmentStatsDto> {
    const attachments = await this.prisma.attachment.findMany();

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats: AttachmentStatsDto = {
      totalFiles: attachments.length,
      totalSize: attachments.reduce((sum, att) => sum + Number(att.fileSize), 0),
      fileTypes: {},
      recentUploads: 0,
    };

    attachments.forEach((att) => {
      const extension = att.originalName.split('.').pop()?.toLowerCase() || 'unknown';
      stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;

      if (att.uploadedAt > yesterday) {
        stats.recentUploads++;
      }
    });

    return stats;
  }

  /**
   * Upload de plusieurs fichiers
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    taskId: string | undefined,
    projectId: string | undefined,
    userId: string,
  ) {
    const results = [];

    for (const file of files) {
      try {
        const dto: CreateAttachmentDto = {
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          taskId,
          projectId,
        };

        const attachment = await this.uploadFile(file, dto, userId);
        results.push({ success: true, attachment });
      } catch (error) {
        results.push({
          success: false,
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    return results;
  }
}
