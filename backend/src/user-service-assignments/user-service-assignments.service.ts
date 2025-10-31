import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class UserServiceAssignmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateAssignmentDto) {
    // Vérifier que l'utilisateur et le service existent
    const [user, service] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: createDto.userId } }),
      this.prisma.organizationService.findUnique({ where: { id: createDto.serviceId } }),
    ]);

    if (!user) {
      throw new NotFoundException(`User with ID ${createDto.userId} not found`);
    }
    if (!service) {
      throw new NotFoundException(`Service with ID ${createDto.serviceId} not found`);
    }

    // Vérifier qu'il n'existe pas déjà d'assignation active
    const existing = await this.prisma.userServiceAssignment.findUnique({
      where: {
        userId_serviceId: {
          userId: createDto.userId,
          serviceId: createDto.serviceId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `User is already assigned to this service. Use PATCH to update.`,
      );
    }

    return this.prisma.userServiceAssignment.create({
      data: {
        userId: createDto.userId,
        serviceId: createDto.serviceId,
        role: createDto.role,
        startDate: createDto.startDate ? new Date(createDto.startDate) : null,
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
        isActive: createDto.isActive !== undefined ? createDto.isActive : true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.userServiceAssignment.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.userServiceAssignment.findMany({
      where: { userId, isActive: true },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          },
        },
      },
    });
  }

  async findByService(serviceId: string) {
    return this.prisma.userServiceAssignment.findMany({
      where: { serviceId, isActive: true },
      include: {
        user: {
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

  async findOne(id: string) {
    const assignment = await this.prisma.userServiceAssignment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    return assignment;
  }

  async update(id: string, updateDto: UpdateAssignmentDto) {
    await this.findOne(id); // Vérifie l'existence

    return this.prisma.userServiceAssignment.update({
      where: { id },
      data: {
        role: updateDto.role,
        startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
        isActive: updateDto.isActive,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Vérifie l'existence

    // Soft delete
    return this.prisma.userServiceAssignment.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats() {
    const [totalAssignments, activeAssignments, users, services] = await Promise.all([
      this.prisma.userServiceAssignment.count(),
      this.prisma.userServiceAssignment.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.organizationService.count({ where: { isActive: true } }),
    ]);

    // Utilisateurs avec au moins une assignation active
    const assignedUsersCount = await this.prisma.userServiceAssignment
      .groupBy({
        by: ['userId'],
        where: { isActive: true },
      })
      .then((groups) => groups.length);

    // Services avec au moins une assignation active
    const servicesWithUsersCount = await this.prisma.userServiceAssignment
      .groupBy({
        by: ['serviceId'],
        where: { isActive: true },
      })
      .then((groups) => groups.length);

    return {
      totalAssignments,
      activeAssignments,
      totalUsers: users,
      totalServices: services,
      assignedUsersCount,
      unassignedUsersCount: users - assignedUsersCount,
      servicesWithUsersCount,
      servicesWithoutUsersCount: services - servicesWithUsersCount,
    };
  }
}
