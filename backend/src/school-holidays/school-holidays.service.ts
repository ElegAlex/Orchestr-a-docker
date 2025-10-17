import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolHolidayDto } from './dto/create-school-holiday.dto';
import { UpdateSchoolHolidayDto } from './dto/update-school-holiday.dto';
import { SchoolHoliday, SchoolHolidayZone } from '@prisma/client';

@Injectable()
export class SchoolHolidaysService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau congé scolaire
   */
  async create(createDto: CreateSchoolHolidayDto): Promise<SchoolHoliday> {
    return this.prisma.schoolHoliday.create({
      data: {
        name: createDto.name,
        period: createDto.period,
        zone: createDto.zone,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        year: createDto.year,
      },
    });
  }

  /**
   * Récupérer tous les congés scolaires (avec filtres optionnels)
   */
  async findAll(params?: {
    year?: number;
    zone?: SchoolHolidayZone;
    period?: string;
  }): Promise<SchoolHoliday[]> {
    return this.prisma.schoolHoliday.findMany({
      where: {
        ...(params?.year && { year: params.year }),
        ...(params?.zone && { zone: params.zone }),
        ...(params?.period && { period: params.period as any }),
      },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Récupérer les congés scolaires pour une année scolaire
   */
  async findByYear(schoolYear: number): Promise<SchoolHoliday[]> {
    return this.prisma.schoolHoliday.findMany({
      where: { year: schoolYear },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Récupérer les congés scolaires pour une période donnée
   */
  async findByPeriod(
    startDate: Date,
    endDate: Date,
    zone?: SchoolHolidayZone,
  ): Promise<SchoolHoliday[]> {
    return this.prisma.schoolHoliday.findMany({
      where: {
        ...(zone && zone !== 'ALL' && { zone: { in: [zone, 'ALL'] } }),
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Récupérer un congé scolaire par ID
   */
  async findOne(id: string): Promise<SchoolHoliday> {
    const schoolHoliday = await this.prisma.schoolHoliday.findUnique({
      where: { id },
    });

    if (!schoolHoliday) {
      throw new NotFoundException(`Congé scolaire avec l'ID ${id} non trouvé`);
    }

    return schoolHoliday;
  }

  /**
   * Vérifier si une date est dans une période de congés scolaires
   */
  async isSchoolHoliday(date: Date, zone?: SchoolHolidayZone): Promise<boolean> {
    const count = await this.prisma.schoolHoliday.count({
      where: {
        ...(zone && zone !== 'ALL' && { zone: { in: [zone, 'ALL'] } }),
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    return count > 0;
  }

  /**
   * Récupérer le congé scolaire pour une date donnée
   */
  async getSchoolHolidayForDate(
    date: Date,
    zone?: SchoolHolidayZone,
  ): Promise<SchoolHoliday | null> {
    return this.prisma.schoolHoliday.findFirst({
      where: {
        ...(zone && zone !== 'ALL' && { zone: { in: [zone, 'ALL'] } }),
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }

  /**
   * Mettre à jour un congé scolaire
   */
  async update(id: string, updateDto: UpdateSchoolHolidayDto): Promise<SchoolHoliday> {
    await this.findOne(id); // Vérifie l'existence

    return this.prisma.schoolHoliday.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.period && { period: updateDto.period }),
        ...(updateDto.zone && { zone: updateDto.zone }),
        ...(updateDto.startDate && { startDate: new Date(updateDto.startDate) }),
        ...(updateDto.endDate && { endDate: new Date(updateDto.endDate) }),
        ...(updateDto.year !== undefined && { year: updateDto.year }),
      },
    });
  }

  /**
   * Supprimer un congé scolaire
   */
  async remove(id: string): Promise<SchoolHoliday> {
    await this.findOne(id); // Vérifie l'existence

    return this.prisma.schoolHoliday.delete({
      where: { id },
    });
  }

  /**
   * Statistiques des congés scolaires pour une année
   */
  async getStats(schoolYear: number) {
    const holidays = await this.findByYear(schoolYear);

    const byPeriod = holidays.reduce((acc, holiday) => {
      acc[holiday.period] = (acc[holiday.period] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byZone = holidays.reduce((acc, holiday) => {
      acc[holiday.zone] = (acc[holiday.zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: holidays.length,
      byPeriod,
      byZone,
      schoolYear,
    };
  }
}
