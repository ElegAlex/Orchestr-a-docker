import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LeaveTypesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau type de congé
   */
  async create(createLeaveTypeDto: CreateLeaveTypeDto, userId: string) {
    // Vérifier que le code n'existe pas déjà
    const existing = await this.prisma.leaveTypeConfig.findUnique({
      where: { code: createLeaveTypeDto.code },
    });

    if (existing) {
      throw new ConflictException(`Le code "${createLeaveTypeDto.code}" existe déjà`);
    }

    return this.prisma.leaveTypeConfig.create({
      data: {
        ...createLeaveTypeDto,
        defaultDays: new Decimal(createLeaveTypeDto.defaultDays),
        createdBy: userId,
        isSystem: false, // Les types créés manuellement ne sont pas système
      },
    });
  }

  /**
   * Récupérer tous les types de congés (actifs uniquement par défaut)
   */
  async findAll(includeInactive = false) {
    return this.prisma.leaveTypeConfig.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Récupérer un type de congé par son ID
   */
  async findOne(id: string) {
    const leaveType = await this.prisma.leaveTypeConfig.findUnique({
      where: { id },
    });

    if (!leaveType) {
      throw new NotFoundException(`Type de congé avec l'ID ${id} non trouvé`);
    }

    return leaveType;
  }

  /**
   * Récupérer un type de congé par son code
   */
  async findByCode(code: string) {
    const leaveType = await this.prisma.leaveTypeConfig.findUnique({
      where: { code },
    });

    if (!leaveType) {
      throw new NotFoundException(`Type de congé avec le code "${code}" non trouvé`);
    }

    return leaveType;
  }

  /**
   * Mettre à jour un type de congé
   */
  async update(id: string, updateLeaveTypeDto: UpdateLeaveTypeDto) {
    // Vérifier que le type existe
    const leaveType = await this.findOne(id);

    // Empêcher la modification de certains champs pour les types système
    if (leaveType.isSystem) {
      // Les types système peuvent être modifiés mais avec restrictions
      const { name, description, ...safeUpdates } = updateLeaveTypeDto;

      return this.prisma.leaveTypeConfig.update({
        where: { id },
        data: {
          ...safeUpdates,
          defaultDays: updateLeaveTypeDto.defaultDays !== undefined
            ? new Decimal(updateLeaveTypeDto.defaultDays)
            : undefined,
        },
      });
    }

    return this.prisma.leaveTypeConfig.update({
      where: { id },
      data: {
        ...updateLeaveTypeDto,
        defaultDays: updateLeaveTypeDto.defaultDays !== undefined
          ? new Decimal(updateLeaveTypeDto.defaultDays)
          : undefined,
      },
    });
  }

  /**
   * Désactiver un type de congé (soft delete)
   */
  async deactivate(id: string) {
    const leaveType = await this.findOne(id);

    if (leaveType.isSystem) {
      throw new ForbiddenException('Les types de congés système ne peuvent pas être désactivés');
    }

    return this.prisma.leaveTypeConfig.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Réactiver un type de congé
   */
  async activate(id: string) {
    return this.prisma.leaveTypeConfig.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Supprimer un type de congé (hard delete)
   * Uniquement pour les types non-système
   */
  async remove(id: string) {
    const leaveType = await this.findOne(id);

    if (leaveType.isSystem) {
      throw new ForbiddenException('Les types de congés système ne peuvent pas être supprimés');
    }

    return this.prisma.leaveTypeConfig.delete({
      where: { id },
    });
  }

  /**
   * Réorganiser l'ordre des types
   */
  async reorder(orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.leaveTypeConfig.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })
    );

    await this.prisma.$transaction(updates);

    return this.findAll();
  }

  /**
   * Calculer le total de jours de congés par défaut
   */
  async calculateTotalDefaultDays() {
    const types = await this.findAll();

    const total = types.reduce((sum, type) => {
      if (type.countInBalance) {
        return sum + Number(type.defaultDays);
      }
      return sum;
    }, 0);

    return {
      total,
      breakdown: types.map(t => ({
        code: t.code,
        name: t.name,
        days: Number(t.defaultDays),
        countsInBalance: t.countInBalance,
      })),
    };
  }
}
