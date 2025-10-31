import { holidaysAPI } from './api/holidays.api';
import { Holiday } from '../types';

/**
 * Service de gestion des jours fériés
 * Migration complète vers API REST backend (17 oct 2025)
 */
class HolidayService {
  // ========================================
  // CALCUL AUTOMATIQUE DES JOURS FÉRIÉS FRANÇAIS
  // ========================================

  /**
   * Calcule tous les jours fériés français pour une année donnée
   */
  generateFrenchHolidays(year: number): Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>[] {
    const holidays: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    // Jours fériés fixes
    const fixedHolidays = [
      { name: 'Jour de l\'An', month: 0, day: 1 },
      { name: 'Fête du Travail', month: 4, day: 1 },
      { name: 'Fête de la Victoire', month: 4, day: 8 },
      { name: 'Fête Nationale', month: 6, day: 14 },
      { name: 'Assomption', month: 7, day: 15 },
      { name: 'Toussaint', month: 10, day: 1 },
      { name: 'Armistice', month: 10, day: 11 },
      { name: 'Noël', month: 11, day: 25 },
    ];

    fixedHolidays.forEach(holiday => {
      holidays.push({
        name: holiday.name,
        date: new Date(year, holiday.month, holiday.day),
        type: 'FIXED',
        isNational: true,
        regions: [],
        isWorkingDay: false,
      });
    });

    // Calcul de Pâques (algorithme de Gauss)
    const easter = this.calculateEaster(year);

    // Jours fériés basés sur Pâques
    const easterBasedHolidays = [
      { name: 'Lundi de Pâques', offset: 1 },
      { name: 'Ascension', offset: 39 },
      { name: 'Lundi de Pentecôte', offset: 50 },
    ];

    easterBasedHolidays.forEach(holiday => {
      const date = new Date(easter);
      date.setDate(date.getDate() + holiday.offset);

      holidays.push({
        name: holiday.name,
        date,
        type: 'CALCULATED',
        isNational: true,
        regions: [],
        isWorkingDay: false,
      });
    });

    // Jours fériés spécifiques à l'Alsace-Moselle
    // Vendredi Saint (2 jours avant Pâques)
    const goodFriday = new Date(easter);
    goodFriday.setDate(goodFriday.getDate() - 2);

    holidays.push({
      name: 'Vendredi Saint',
      date: goodFriday,
      type: 'CALCULATED',
      isNational: false,
      regions: ['Alsace', 'Moselle'],
      isWorkingDay: false,
    });

    // Saint-Étienne (26 décembre)
    holidays.push({
      name: 'Saint-Étienne',
      date: new Date(year, 11, 26),
      type: 'FIXED',
      isNational: false,
      regions: ['Alsace', 'Moselle'],
      isWorkingDay: false,
    });

    return holidays;
  }

  /**
   * Calcule la date de Pâques pour une année donnée (algorithme de Gauss)
   */
  private calculateEaster(year: number): Date {
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
    const n = Math.floor((h + l - 7 * m + 114) / 31);
    const p = (h + l - 7 * m + 114) % 31;

    return new Date(year, n - 1, p + 1);
  }

  // ========================================
  // CRUD OPERATIONS - API REST
  // ========================================

  /**
   * Récupère tous les jours fériés pour une année
   */
  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    try {
      const holidays = await holidaysAPI.getByYear(year);
      return holidays.map(h => ({
        ...h,
        date: new Date(h.date),
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des jours fériés:', error);
      return [];
    }
  }

  /**
   * Récupère les jours fériés pour une période donnée
   */
  async getHolidaysByPeriod(startDate: Date, endDate: Date): Promise<Holiday[]> {
    try {
      const holidays = await holidaysAPI.getByPeriod(
        startDate.toISOString(),
        endDate.toISOString()
      );
      return holidays.map(h => ({
        ...h,
        date: new Date(h.date),
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des jours fériés:', error);
      return [];
    }
  }

  /**
   * Ajoute un jour férié personnalisé
   */
  async addHoliday(holiday: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const created = await holidaysAPI.create({
        name: holiday.name,
        date: holiday.date.toISOString(),
        type: holiday.type,
        isNational: holiday.isNational,
        regions: holiday.regions || [],
        isWorkingDay: holiday.isWorkingDay || false,
      });
      return created.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du jour férié:', error);
      throw error;
    }
  }

  /**
   * Met à jour un jour férié (notamment pour override en jour ouvré)
   */
  async updateHoliday(holidayId: string, updates: Partial<Holiday>): Promise<void> {
    try {
      await holidaysAPI.update(holidayId, {
        name: updates.name,
        date: updates.date?.toISOString(),
        type: updates.type,
        isNational: updates.isNational,
        regions: updates.regions,
        isWorkingDay: updates.isWorkingDay,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du jour férié:', error);
      throw error;
    }
  }

  /**
   * Supprime un jour férié
   */
  async deleteHoliday(holidayId: string): Promise<void> {
    try {
      await holidaysAPI.delete(holidayId);
    } catch (error) {
      console.error('Erreur lors de la suppression du jour férié:', error);
      throw error;
    }
  }

  /**
   * Initialise automatiquement les jours fériés pour une année
   */
  async initializeYearHolidays(year: number): Promise<void> {
    try {
      // Vérifier si les jours fériés existent déjà
      const existingHolidays = await this.getHolidaysByYear(year);
      if (existingHolidays.length > 0) {
        console.log(`Les jours fériés pour ${year} existent déjà`);
        return;
      }

      // Générer et sauvegarder les jours fériés
      const holidays = this.generateFrenchHolidays(year);

      const promises = holidays.map(holiday => this.addHoliday(holiday));
      await Promise.all(promises);

      console.log(`${holidays.length} jours fériés initialisés pour ${year}`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des jours fériés:', error);
      throw error;
    }
  }

  /**
   * Override un jour férié en jour ouvré
   */
  async overrideAsWorkingDay(holidayId: string, isWorkingDay: boolean): Promise<void> {
    try {
      await this.updateHoliday(holidayId, { isWorkingDay });
    } catch (error) {
      console.error('Erreur lors de l\'override du jour férié:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  /**
   * Vérifie si une date est un jour férié
   */
  async isHoliday(date: Date, region?: string): Promise<boolean> {
    try {
      const response = await holidaysAPI.checkIsHoliday(date.toISOString(), region);
      return response.isHoliday;
    } catch (error) {
      console.error('Erreur lors de la vérification du jour férié:', error);
      return false;
    }
  }

  /**
   * Compte le nombre de jours ouvrés entre deux dates
   */
  async getWorkingDaysBetween(startDate: Date, endDate: Date, region?: string): Promise<number> {
    try {
      const response = await holidaysAPI.getWorkingDays(
        startDate.toISOString(),
        endDate.toISOString(),
        region
      );
      return response.workingDays;
    } catch (error) {
      console.error('Erreur lors du calcul des jours ouvrés:', error);
      throw error;
    }
  }

  /**
   * Récupère les prochains jours fériés
   */
  async getUpcomingHolidays(limit: number = 5): Promise<Holiday[]> {
    try {
      const holidays = await holidaysAPI.getUpcoming(limit);
      return holidays.map(h => ({
        ...h,
        date: new Date(h.date),
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des prochains jours fériés:', error);
      return [];
    }
  }

  /**
   * Utilitaire pour comparer deux dates (même jour)
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Formate une date pour l'affichage
   */
  formatHolidayDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Récupère les statistiques des jours fériés pour une année
   */
  async getHolidayStats(year: number): Promise<{
    total: number;
    national: number;
    regional: number;
    workingDayOverrides: number;
    byMonth: { [month: string]: number };
  }> {
    try {
      const stats = await holidaysAPI.getStats(year);
      const holidays = await this.getHolidaysByYear(year);

      // Calculer byMonth localement
      const byMonth: { [month: string]: number } = {};
      holidays.forEach(holiday => {
        const month = holiday.date.toLocaleDateString('fr-FR', { month: 'long' });
        byMonth[month] = (byMonth[month] || 0) + 1;
      });

      return {
        total: stats.total,
        national: stats.national,
        regional: stats.regional,
        workingDayOverrides: stats.workingDays,
        byMonth,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
}

export const holidayService = new HolidayService();
