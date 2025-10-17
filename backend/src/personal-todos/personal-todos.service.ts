import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonalTodoDto } from './dto/create-personal-todo.dto';
import { UpdatePersonalTodoDto } from './dto/update-personal-todo.dto';

@Injectable()
export class PersonalTodosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une personal todo
   */
  async create(userId: string, createDto: CreatePersonalTodoDto) {
    return this.prisma.personalTodo.create({
      data: {
        userId,
        text: createDto.text,
        priority: createDto.priority ?? 3,
        completed: false,
      },
    });
  }

  /**
   * Récupérer toutes les todos d'un utilisateur
   */
  async findByUser(userId: string, completed?: boolean) {
    const where: any = { userId };

    if (completed !== undefined) {
      where.completed = completed;
    }

    return this.prisma.personalTodo.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Récupérer une todo par ID
   */
  async findOne(id: string, userId: string) {
    const todo = await this.prisma.personalTodo.findFirst({
      where: { id, userId },
    });

    if (!todo) {
      throw new NotFoundException(`PersonalTodo with ID ${id} not found`);
    }

    return todo;
  }

  /**
   * Mettre à jour une todo
   */
  async update(id: string, userId: string, updateDto: UpdatePersonalTodoDto) {
    // Vérifier que la todo existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    const updateData: any = { ...updateDto };

    // Si on marque comme complété, ajouter completedAt
    if (updateDto.completed === true) {
      updateData.completedAt = new Date();
    } else if (updateDto.completed === false) {
      updateData.completedAt = null;
    }

    return this.prisma.personalTodo.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Toggle completed status
   */
  async toggle(id: string, userId: string) {
    const todo = await this.findOne(id, userId);

    return this.prisma.personalTodo.update({
      where: { id },
      data: {
        completed: !todo.completed,
        completedAt: !todo.completed ? new Date() : null,
      },
    });
  }

  /**
   * Supprimer une todo
   */
  async remove(id: string, userId: string) {
    // Vérifier que la todo existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    return this.prisma.personalTodo.delete({
      where: { id },
    });
  }

  /**
   * Supprimer toutes les todos complétées d'un utilisateur
   */
  async removeCompleted(userId: string) {
    const result = await this.prisma.personalTodo.deleteMany({
      where: {
        userId,
        completed: true,
      },
    });

    return { deleted: result.count };
  }
}
