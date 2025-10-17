import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const { manager, ...restData } = createServiceDto;

    return this.prisma.organizationService.create({
      data: {
        ...restData,
        manager: manager || null,
      },
      include: {
        managedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(isActive?: boolean) {
    return this.prisma.organizationService.findMany({
      where: isActive !== undefined ? { isActive } : undefined,
      include: {
        managedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userAssignments: {
          where: { isActive: true },
          select: {
            id: true,
            userId: true,
            role: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.organizationService.findUnique({
      where: { id },
      include: {
        managedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userAssignments: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.findOne(id); // Vérifie l'existence

    const { manager, ...restData } = updateServiceDto;

    return this.prisma.organizationService.update({
      where: { id },
      data: {
        ...restData,
        ...(manager !== undefined && {
          manager: manager || null,
        }),
      },
      include: {
        managedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Vérifie l'existence

    // Soft delete
    return this.prisma.organizationService.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats() {
    const services = await this.prisma.organizationService.findMany({
      where: { isActive: true },
      include: {
        managedBy: true,
      },
    });

    return {
      total: services.length,
      withManager: services.filter((s) => s.manager !== null).length,
      totalBudget: services.reduce((sum, s) => sum + (s.budget || 0), 0),
    };
  }
}
