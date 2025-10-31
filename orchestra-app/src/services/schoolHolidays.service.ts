import { schoolHolidaysAPI } from './api/schoolHolidays.api';
import { SchoolHoliday, SchoolHolidayZone, SchoolHolidayPeriod } from '../types';

/**
 * Service de gestion des congés scolaires
 * Migration complète vers API REST backend (17 oct 2025)
 */
class SchoolHolidaysService {
  // ========================================
  // DONNÉES OFFICIELLES CONGÉS SCOLAIRES FRANÇAIS
  // ========================================

  /**
   * Génère les congés scolaires français officiels pour une année scolaire
   * @param schoolYear Année de début (ex: 2024 pour 2024-2025)
   */
  generateFrenchSchoolHolidays(schoolYear: number): Omit<SchoolHoliday, 'id' | 'createdAt' | 'updatedAt'>[] {
    const holidays: Omit<SchoolHoliday, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    // Calendrier officiel 2024-2025 (source: Ministère de l'Éducation Nationale)
    if (schoolYear === 2024) {
      // Toussaint 2024 (toutes zones)
      holidays.push({
        name: 'Vacances de la Toussaint 2024',
        period: 'TOUSSAINT',
        zone: 'ALL',
        startDate: new Date(2024, 9, 19),
        endDate: new Date(2024, 10, 4),
        year: schoolYear,
      });

      // Noël 2024 (toutes zones)
      holidays.push({
        name: 'Vacances de Noël 2024',
        period: 'NOEL',
        zone: 'ALL',
        startDate: new Date(2024, 11, 21),
        endDate: new Date(2025, 0, 6),
        year: schoolYear,
      });

      // Hiver 2025
      holidays.push(
        {
          name: 'Vacances d\'hiver 2025 - Zone A',
          period: 'HIVER',
          zone: 'A',
          startDate: new Date(2025, 1, 8),
          endDate: new Date(2025, 1, 24),
          year: schoolYear,
        },
        {
          name: 'Vacances d\'hiver 2025 - Zone B',
          period: 'HIVER',
          zone: 'B',
          startDate: new Date(2025, 1, 15),
          endDate: new Date(2025, 2, 3),
          year: schoolYear,
        },
        {
          name: 'Vacances d\'hiver 2025 - Zone C',
          period: 'HIVER',
          zone: 'C',
          startDate: new Date(2025, 1, 22),
          endDate: new Date(2025, 2, 10),
          year: schoolYear,
        }
      );

      // Printemps 2025
      holidays.push(
        {
          name: 'Vacances de printemps 2025 - Zone A',
          period: 'PRINTEMPS',
          zone: 'A',
          startDate: new Date(2025, 3, 5),
          endDate: new Date(2025, 3, 22),
          year: schoolYear,
        },
        {
          name: 'Vacances de printemps 2025 - Zone B',
          period: 'PRINTEMPS',
          zone: 'B',
          startDate: new Date(2025, 3, 12),
          endDate: new Date(2025, 3, 28),
          year: schoolYear,
        },
        {
          name: 'Vacances de printemps 2025 - Zone C',
          period: 'PRINTEMPS',
          zone: 'C',
          startDate: new Date(2025, 3, 19),
          endDate: new Date(2025, 4, 5),
          year: schoolYear,
        }
      );

      // Été 2025 (toutes zones)
      holidays.push({
        name: 'Grandes vacances d\'été 2025',
        period: 'ETE',
        zone: 'ALL',
        startDate: new Date(2025, 6, 5),
        endDate: new Date(2025, 8, 1),
        year: schoolYear,
      });
    }

    // Calendrier 2025-2026
    if (schoolYear === 2025) {
      holidays.push(
        {
          name: 'Vacances de la Toussaint 2025',
          period: 'TOUSSAINT',
          zone: 'ALL',
          startDate: new Date(2025, 9, 18),
          endDate: new Date(2025, 10, 3),
          year: schoolYear,
        },
        {
          name: 'Vacances de Noël 2025',
          period: 'NOEL',
          zone: 'ALL',
          startDate: new Date(2025, 11, 20),
          endDate: new Date(2026, 0, 5),
          year: schoolYear,
        },
        // Hiver 2026
        {
          name: 'Vacances d\'hiver 2026 - Zone A',
          period: 'HIVER',
          zone: 'A',
          startDate: new Date(2026, 1, 7),
          endDate: new Date(2026, 1, 23),
          year: schoolYear,
        },
        {
          name: 'Vacances d\'hiver 2026 - Zone B',
          period: 'HIVER',
          zone: 'B',
          startDate: new Date(2026, 1, 21),
          endDate: new Date(2026, 2, 9),
          year: schoolYear,
        },
        {
          name: 'Vacances d\'hiver 2026 - Zone C',
          period: 'HIVER',
          zone: 'C',
          startDate: new Date(2026, 1, 14),
          endDate: new Date(2026, 2, 2),
          year: schoolYear,
        },
        // Printemps 2026
        {
          name: 'Vacances de printemps 2026 - Zone A',
          period: 'PRINTEMPS',
          zone: 'A',
          startDate: new Date(2026, 3, 4),
          endDate: new Date(2026, 3, 20),
          year: schoolYear,
        },
        {
          name: 'Vacances de printemps 2026 - Zone B',
          period: 'PRINTEMPS',
          zone: 'B',
          startDate: new Date(2026, 3, 18),
          endDate: new Date(2026, 4, 4),
          year: schoolYear,
        },
        {
          name: 'Vacances de printemps 2026 - Zone C',
          period: 'PRINTEMPS',
          zone: 'C',
          startDate: new Date(2026, 3, 25),
          endDate: new Date(2026, 4, 11),
          year: schoolYear,
        },
        // Été 2026
        {
          name: 'Grandes vacances d\'été 2026',
          period: 'ETE',
          zone: 'ALL',
          startDate: new Date(2026, 6, 4),
          endDate: new Date(2026, 8, 1),
          year: schoolYear,
        }
      );
    }

    return holidays;
  }

  // ========================================
  // CRUD OPERATIONS - API REST
  // ========================================

  /**
   * Récupère tous les congés scolaires d'une année
   */
  async getSchoolHolidaysByYear(year: number): Promise<SchoolHoliday[]> {
    try {
      const holidays = await schoolHolidaysAPI.getByYear(year);
      return holidays.map(h => ({
        ...h,
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate),
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des congés scolaires:', error);
      return [];
    }
  }

  /**
   * Récupère les congés scolaires pour une période donnée
   */
  async getSchoolHolidaysByPeriod(startDate: Date, endDate: Date, zone?: SchoolHolidayZone): Promise<SchoolHoliday[]> {
    try {
      const holidays = await schoolHolidaysAPI.getByPeriod(
        startDate.toISOString(),
        endDate.toISOString(),
        zone
      );
      return holidays.map(h => ({
        ...h,
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate),
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des congés scolaires:', error);
      return [];
    }
  }

  /**
   * Récupère les congés scolaires par zone
   */
  async getSchoolHolidaysByZone(zone: SchoolHolidayZone, year?: number): Promise<SchoolHoliday[]> {
    try {
      const holidays = await schoolHolidaysAPI.getByZone(zone, year);
      return holidays.map(h => ({
        ...h,
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate),
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des congés par zone:', error);
      return [];
    }
  }

  /**
   * Récupère les congés scolaires par période (Toussaint, Noël, etc.)
   */
  async getSchoolHolidaysByPeriodType(period: SchoolHolidayPeriod, year?: number): Promise<SchoolHoliday[]> {
    try {
      const holidays = await schoolHolidaysAPI.getByPeriodType(period, year);
      return holidays.map(h => ({
        ...h,
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate),
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des congés par période:', error);
      return [];
    }
  }

  /**
   * Ajoute un congé scolaire personnalisé
   */
  async addSchoolHoliday(holiday: Omit<SchoolHoliday, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const created = await schoolHolidaysAPI.create({
        name: holiday.name,
        period: holiday.period,
        zone: holiday.zone,
        startDate: holiday.startDate.toISOString(),
        endDate: holiday.endDate.toISOString(),
        year: holiday.year,
      });
      return created.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du congé scolaire:', error);
      throw error;
    }
  }

  /**
   * Met à jour un congé scolaire
   */
  async updateSchoolHoliday(holidayId: string, updates: Partial<SchoolHoliday>): Promise<void> {
    try {
      await schoolHolidaysAPI.update(holidayId, {
        name: updates.name,
        period: updates.period,
        zone: updates.zone,
        startDate: updates.startDate?.toISOString(),
        endDate: updates.endDate?.toISOString(),
        year: updates.year,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du congé scolaire:', error);
      throw error;
    }
  }

  /**
   * Supprime un congé scolaire
   */
  async deleteSchoolHoliday(holidayId: string): Promise<void> {
    try {
      await schoolHolidaysAPI.delete(holidayId);
    } catch (error) {
      console.error('Erreur lors de la suppression du congé scolaire:', error);
      throw error;
    }
  }

  /**
   * Initialise automatiquement les congés scolaires pour une année
   */
  async initializeYearSchoolHolidays(year: number): Promise<void> {
    try {
      // Vérifier si les congés existent déjà
      const existingHolidays = await this.getSchoolHolidaysByYear(year);
      if (existingHolidays.length > 0) {
        console.log(`Les congés scolaires pour ${year} existent déjà`);
        return;
      }

      // Générer et sauvegarder les congés
      const holidays = this.generateFrenchSchoolHolidays(year);
      const promises = holidays.map(holiday => this.addSchoolHoliday(holiday));
      await Promise.all(promises);

      console.log(`${holidays.length} congés scolaires initialisés pour ${year}`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des congés scolaires:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  /**
   * Vérifie si une date est un congé scolaire
   */
  async isSchoolHoliday(date: Date, zone: SchoolHolidayZone = 'ALL'): Promise<boolean> {
    try {
      const response = await schoolHolidaysAPI.checkIsSchoolHoliday(date.toISOString(), zone);
      return response.isSchoolHoliday;
    } catch (error) {
      console.error('Erreur lors de la vérification du congé scolaire:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques pour une année
   */
  async getStats(year: number) {
    try {
      return await schoolHolidaysAPI.getStats(year);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Formate une période de congé scolaire
   */
  formatPeriodLabel(period: SchoolHolidayPeriod): string {
    const labels: Record<SchoolHolidayPeriod, string> = {
      TOUSSAINT: 'Toussaint',
      NOEL: 'Noël',
      HIVER: 'Hiver',
      PRINTEMPS: 'Printemps',
      ETE: 'Été',
    };
    return labels[period];
  }

  /**
   * Formate une zone scolaire
   */
  formatZoneLabel(zone: SchoolHolidayZone): string {
    if (zone === 'ALL') return 'Toutes zones';
    return `Zone ${zone}`;
  }
}

export const schoolHolidaysService = new SchoolHolidaysService();
