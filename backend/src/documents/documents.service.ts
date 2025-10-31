import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from './minio.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';

/**
 * Service de gestion des documents
 *
 * Fonctionnalités :
 * - Upload de fichiers vers MinIO
 * - Téléchargement de fichiers depuis MinIO
 * - Gestion des métadonnées en base de données
 * - Filtrage et recherche avancés
 * - Permissions et sécurité
 */
@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  /**
   * Upload un document (fichier + métadonnées)
   */
  async uploadDocument(
    uploadDto: UploadDocumentDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    // Vérifier que le projet existe si spécifié
    if (uploadDto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: uploadDto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Projet non trouvé');
      }
    }

    // Vérifier que la tâche existe si spécifiée
    if (uploadDto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: uploadDto.taskId },
      });

      if (!task) {
        throw new NotFoundException('Tâche non trouvée');
      }
    }

    try {
      // Upload vers MinIO
      const storagePath = await this.minioService.uploadFile(
        file.originalname,
        file.buffer,
        file.mimetype,
      );

      // Créer l'entrée en base de données
      const document = await this.prisma.document.create({
        data: {
          name: uploadDto.name || file.originalname,
          originalName: file.originalname,
          type: file.mimetype,
          size: BigInt(file.size),
          storagePath,
          projectId: uploadDto.projectId || null,
          taskId: uploadDto.taskId || null,
          uploadedBy: userId,
          isPublic: uploadDto.isPublic || false,
          tags: uploadDto.tags || [],
          metadata: uploadDto.metadata || {},
        } as any,
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Convertir BigInt en string pour JSON
      return {
        ...document,
        size: document.size.toString(),
      };
    } catch (error) {
      console.error('Erreur upload document:', error);
      throw new BadRequestException(
        `Erreur lors de l'upload du document: ${error.message}`,
      );
    }
  }

  /**
   * Récupérer tous les documents avec filtrage et pagination
   */
  async findAll(filterDto: FilterDocumentDto) {
    const {
      search,
      projectId,
      taskId,
      uploadedBy,
      type,
      tag,
      isPublic,
      page = 1,
      limit = 20,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
    } = filterDto;

    // Construction des filtres WHERE
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    if (uploadedBy) {
      where.uploadedBy = uploadedBy;
    }

    if (type) {
      where.type = { contains: type, mode: 'insensitive' };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécuter les requêtes en parallèle
    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    // Convertir BigInt en string pour JSON
    const documentsWithStringSize = documents.map((doc) => ({
      ...doc,
      size: doc.size.toString(),
    }));

    return {
      data: documentsWithStringSize,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer un document par ID
   */
  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    return {
      ...document,
      size: document.size.toString(),
    };
  }

  /**
   * Télécharger un fichier
   */
  async downloadFile(id: string) {
    const document = await this.findOne(id);

    try {
      const fileBuffer = await this.minioService.downloadFile(
        document.storagePath,
      );

      return {
        buffer: fileBuffer,
        filename: document.originalName,
        mimetype: document.type,
      };
    } catch (error) {
      throw new NotFoundException('Fichier introuvable dans le stockage');
    }
  }

  /**
   * Générer une URL de téléchargement temporaire (24h)
   */
  async getDownloadUrl(id: string) {
    const document = await this.findOne(id);

    try {
      const url = await this.minioService.getPresignedUrl(document.storagePath);

      return {
        url,
        expiresIn: 86400, // 24 heures en secondes
        document: {
          id: document.id,
          name: document.name,
          originalName: document.originalName,
          type: document.type,
          size: document.size,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        'Impossible de générer l\'URL de téléchargement',
      );
    }
  }

  /**
   * Mettre à jour les métadonnées d'un document
   */
  async update(id: string, updateDto: UpdateDocumentDto, userId: string) {
    // Vérifier que le document existe
    const existingDocument = await this.findOne(id);

    // Vérification de permissions : seul l'uploader ou un ADMIN peut modifier
    // Cette logique sera gérée au niveau du controller avec les guards

    // Vérifier que le projet existe si modifié
    if (updateDto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: updateDto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Projet non trouvé');
      }
    }

    // Vérifier que la tâche existe si modifiée
    if (updateDto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: updateDto.taskId },
      });

      if (!task) {
        throw new NotFoundException('Tâche non trouvée');
      }
    }

    // Mettre à jour les métadonnées
    const document = await this.prisma.document.update({
      where: { id },
      data: updateDto as any,
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      ...document,
      size: document.size.toString(),
    };
  }

  /**
   * Supprimer un document (fichier + métadonnées)
   */
  async remove(id: string, userId: string) {
    // Vérifier que le document existe
    const document = await this.findOne(id);

    // Vérification de permissions : seul l'uploader ou un ADMIN peut supprimer
    // Cette logique sera gérée au niveau du controller avec les guards

    try {
      // Supprimer le fichier de MinIO
      await this.minioService.deleteFile(document.storagePath);

      // Supprimer l'entrée en base de données
      await this.prisma.document.delete({
        where: { id },
      });

      return { message: 'Document supprimé avec succès' };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la suppression du document: ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les statistiques des documents d'un projet
   */
  async getProjectDocumentStats(projectId: string) {
    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Projet non trouvé');
    }

    // Nombre total de documents
    const totalDocuments = await this.prisma.document.count({
      where: { projectId },
    });

    // Documents par type
    const documentsByType = await this.prisma.document.groupBy({
      by: ['type'],
      where: { projectId },
      _count: true,
    });

    // Taille totale
    const sizeAggregate = await this.prisma.document.aggregate({
      where: { projectId },
      _sum: {
        size: true,
      },
    });

    // Documents publics vs privés
    const publicCount = await this.prisma.document.count({
      where: {
        projectId,
        isPublic: true,
      },
    });

    const privateCount = await this.prisma.document.count({
      where: {
        projectId,
        isPublic: false,
      },
    });

    return {
      project,
      totalDocuments,
      documentsByType,
      totalSize: sizeAggregate._sum.size?.toString() || '0',
      publicCount,
      privateCount,
    };
  }
}
