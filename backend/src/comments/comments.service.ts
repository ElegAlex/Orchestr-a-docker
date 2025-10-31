import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FilterCommentDto } from './dto/filter-comment.dto';

/**
 * Service de gestion des commentaires
 *
 * Fonctionnalités :
 * - CRUD complet des commentaires
 * - Filtrage et recherche avancés
 * - Pagination
 * - Permissions (auteur ou ADMIN peut modifier/supprimer)
 */
@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau commentaire
   */
  async create(createCommentDto: CreateCommentDto, userId: string) {
    const { taskId, content } = createCommentDto;

    // Vérifier que la tâche existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Créer le commentaire
    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
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

    return comment;
  }

  /**
   * Récupérer tous les commentaires avec filtrage et pagination
   */
  async findAll(filterDto: FilterCommentDto) {
    const {
      taskId,
      userId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Construction des filtres WHERE
    const where: any = {};

    if (taskId) {
      where.taskId = taskId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécuter les requêtes en parallèle
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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
      this.prisma.comment.count({ where }),
    ]);

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer un commentaire par ID
   */
  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    return comment;
  }

  /**
   * Mettre à jour un commentaire
   * Seul l'auteur ou un ADMIN peut modifier
   */
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
    userRole: string,
  ) {
    // Vérifier que le commentaire existe
    const existingComment = await this.findOne(id);

    // Vérifier les permissions : auteur ou ADMIN
    if (existingComment.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à modifier ce commentaire',
      );
    }

    // Mettre à jour le commentaire
    const comment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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

    return comment;
  }

  /**
   * Supprimer un commentaire
   * Seul l'auteur ou un ADMIN peut supprimer
   */
  async remove(id: string, userId: string, userRole: string) {
    // Vérifier que le commentaire existe
    const comment = await this.findOne(id);

    // Vérifier les permissions : auteur ou ADMIN
    if (comment.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à supprimer ce commentaire',
      );
    }

    // Supprimer le commentaire
    await this.prisma.comment.delete({
      where: { id },
    });

    return { message: 'Commentaire supprimé avec succès' };
  }

  /**
   * Récupérer les commentaires d'une tâche
   */
  async getTaskComments(taskId: string, filterDto: FilterCommentDto) {
    // Vérifier que la tâche existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Récupérer les commentaires avec le taskId forcé
    const result = await this.findAll({
      ...filterDto,
      taskId,
    });

    return {
      task,
      ...result,
    };
  }
}
