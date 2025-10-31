import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { Holiday, HolidayType } from '@prisma/client';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau jour férié
   */
  async create(createDto: CreateHolidayDto): Promise<Holiday> {
    return this.prisma.holiday.create({
      data: {
        name: createDto.name,
        date: new Date(createDto.date),
        type: createDto.type,
        isNational: createDto.isNational ?? true,
        regions: createDto.regions ?? [],
        isWorkingDay: createDto.isWorkingDay ?? false,
      },
    });
  }

  /**
   * Récupérer tous les jours fériés (avec filtres optionnels)
   */
  async findAll(params?: {
    year?: number;
    isNational?: boolean;
    region?: string;
  }): Promise<Holiday[]> {
    const where: any = {};

    if (params?.year) {
      const startOfYear = new Date(params.year, 0, 1);
      const endOfYear = new Date(params.year, 11, 31, 23, 59, 59);
      where.date = { gte: startOfYear, lte: endOfYear };
    }

    if (params?.isNational !== undefined) {
      where.isNational = params.isNational;
    }

    if (params?.region) {
      where.regions = { has: params.region };
    }

    return this.prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Récupérer les jours fériés pour une année
   */
  async findByYear(year: number): Promise<Holiday[]> {
    return this.findAll({ year });
  }

  /**
   * Récupérer les jours fériés pour une période donnée
   */
  async findByPeriod(
    startDate: Date,
    endDate: Date,
    region?: string,
  ): Promise<Holiday[]> {
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (region) {
      where.OR = [
        { isNational: true },
        { regions: { has: region } },
      ];
    }

    return this.prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Récupérer un jour férié par ID
   */
  async findOne(id: string): Promise<Holiday> {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new NotFoundException(`Jour férié avec l'ID ${id} non trouvé`);
    }

    return holiday;
  }

  /**
   * Vérifier si une date est un jour férié
   */
  async isHoliday(date: Date, region?: string): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      isWorkingDay: false,
    };

    if (region) {
      where.OR = [
        { isNational: true },
        { regions: { has: region } },
      ];
    }

    const count = await this.prisma.holiday.count({ where });
    return count > 0;
  }

  /**
   * Récupérer le jour férié pour une date donnée
   */
  async getHolidayForDate(date: Date, region?: string): Promise<Holiday | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (region) {
      where.OR = [
        { isNational: true },
        { regions: { has: region } },
      ];
    }

    return this.prisma.holiday.findFirst({ where });
  }

  /**
   * Calculer le nombre de jours ouvrés entre deux dates
   * (exclut weekends et jours fériés non travaillés)
   */
  async getWorkingDaysBetween(
    startDate: Date,
    endDate: Date,
    region?: string,
  ): Promise<number> {
    let workingDays = 0;
    const currentDate = new Date(startDate);

    // Récupérer tous les jours fériés de la période
    const holidays = await this.findByPeriod(startDate, endDate, region);
    const holidayDates = new Set(
      holidays
        .filter((h) => !h.isWorkingDay)
        .map((h) => h.date.toISOString().split('T')[0])
    );

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];

      // Exclure weekends (0 = dimanche, 6 = samedi)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Exclure jours fériés
        if (!holidayDates.has(dateStr)) {
          workingDays++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Récupérer les prochains jours fériés
   */
  async getUpcoming(limit: number = 5): Promise<Holiday[]> {
    const now = new Date();
    return this.prisma.holiday.findMany({
      where: {
        date: { gte: now },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  }

  /**
   * Mettre à jour un jour férié
   */
  async update(id: string, updateDto: UpdateHolidayDto): Promise<Holiday> {
    await this.findOne(id); // Vérifie l'existence

    return this.prisma.holiday.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.date && { date: new Date(updateDto.date) }),
        ...(updateDto.type && { type: updateDto.type }),
        ...(updateDto.isNational !== undefined && { isNational: updateDto.isNational }),
        ...(updateDto.regions && { regions: updateDto.regions }),
        ...(updateDto.isWorkingDay !== undefined && { isWorkingDay: updateDto.isWorkingDay }),
      },
    });
  }

  /**
   * Supprimer un jour férié
   */
  async remove(id: string): Promise<Holiday> {
    await this.findOne(id); // Vérifie l'existence

    return this.prisma.holiday.delete({
      where: { id },
    });
  }

  /**
   * Calculer la date de Pâques pour une année donnée
   * Utilise l'algorithme de Gauss
   */
  calculateEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }

  /**
   * Statistiques des jours fériés pour une année
   */
  async getStats(year: number) {
    const holidays = await this.findByYear(year);

    const byType = holidays.reduce((acc, holiday) => {
      acc[holiday.type] = (acc[holiday.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const national = holidays.filter((h) => h.isNational).length;
    const regional = holidays.filter((h) => !h.isNational && h.regions.length > 0).length;
    const workingDays = holidays.filter((h) => h.isWorkingDay).length;

    return {
      total: holidays.length,
      byType,
      national,
      regional,
      workingDays,
      year,
    };
  }
}
