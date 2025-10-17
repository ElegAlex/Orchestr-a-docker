import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    // Générer un code automatiquement si non fourni
    let code = createDepartmentDto.code;
    if (!code) {
      // Générer code à partir du nom : "Marketing Digital" → "MARDI"
      code = createDepartmentDto.name
        .split(' ')
        .map(word => word.substring(0, 2).toUpperCase())
        .join('')
        .substring(0, 20);

      // Si le code existe déjà, ajouter un suffixe numérique
      let suffix = 1;
      let uniqueCode = code;
      while (await this.prisma.department.findUnique({ where: { code: uniqueCode } })) {
        uniqueCode = `${code}${suffix}`;
        suffix++;
      }
      code = uniqueCode;
    } else {
      // Vérifier que le code fourni n'existe pas déjà
      const existing = await this.prisma.department.findUnique({
        where: { code },
      });

      if (existing) {
        throw new ConflictException(`Department with code ${code} already exists`);
      }
    }

    // Vérifier que le manager existe si spécifié
    if (createDepartmentDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: createDepartmentDto.managerId },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with id ${createDepartmentDto.managerId} not found`);
      }
    }

    return this.prisma.department.create({
      data: {
        ...createDepartmentDto,
        code,
        isActive: createDepartmentDto.isActive ?? true,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.department.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
            departmentId: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    // Vérifier que le département existe
    await this.findOne(id);

    // Vérifier unicité du code si modifié
    if (updateDepartmentDto.code) {
      const existing = await this.prisma.department.findUnique({
        where: { code: updateDepartmentDto.code },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Department with code ${updateDepartmentDto.code} already exists`);
      }
    }

    // Vérifier que le manager existe si spécifié
    if (updateDepartmentDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateDepartmentDto.managerId },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with id ${updateDepartmentDto.managerId} not found`);
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Vérifier que le département existe
    await this.findOne(id);

    // Vérifier qu'aucun utilisateur n'est assigné à ce département
    const usersCount = await this.prisma.user.count({
      where: { departmentId: id },
    });

    if (usersCount > 0) {
      throw new ConflictException(
        `Cannot delete department ${id} because it has ${usersCount} assigned user(s). Please reassign users first.`,
      );
    }

    return this.prisma.department.delete({
      where: { id },
    });
  }

  async deactivate(id: string) {
    // Vérifier que le département existe
    await this.findOne(id);

    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    // Vérifier que le département existe
    await this.findOne(id);

    return this.prisma.department.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getUsersByDepartment(departmentId: string) {
    await this.findOne(departmentId);

    return this.prisma.user.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }
}
