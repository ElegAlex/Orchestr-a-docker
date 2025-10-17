/**
 * @deprecated Ce service est déprécié et sera supprimé dans une version future.
 *
 * Utilisez `teleworkServiceV2` à la place, qui offre toutes les fonctionnalités
 * de remote-work.service.ts plus des fonctionnalités avancées :
 * - Workflow d'approbation
 * - Règles d'équipe
 * - Validation des contraintes
 * - Gestion des profils utilisateurs
 *
 * Guide de migration :
 *
 * Avant (remote-work.service.ts) :
 * ```typescript
 * import { remoteWorkService } from './remote-work.service';
 * const schedule = await remoteWorkService.getUserRemoteSchedule(userId);
 * ```
 *
 * Après (telework-v2.service.ts) :
 * ```typescript
 * import { teleworkServiceV2 } from './telework-v2.service';
 * const schedule = await teleworkServiceV2.getSimpleRemoteSchedule(userId);
 * ```
 *
 * Table de correspondance des méthodes :
 * - getUserRemoteSchedule()      → getSimpleRemoteSchedule()
 * - updateUserRemoteSchedule()   → updateSimpleRemoteSchedule()
 * - isUserRemoteOnDate()         → isUserRemoteOnDate()
 * - getRemoteWorkStats()         → getSimpleRemoteWorkStats()
 * - toggleDayRemoteStatus()      → updateSimpleRemoteSchedule() (manuel)
 * - setSpecificRemoteDay()       → requestOverride()
 * - getSpecificRemoteDay()       → getUserOverrides() (filtrer par date)
 * - deleteSpecificRemoteDay()    → deleteOverride()
 *
 * @see telework-v2.service.ts Pour le service de remplacement
 * @see remote-work.service.ts.firebase-backup Pour l'ancienne implémentation Firebase
 */

import { teleworkServiceV2 } from './telework-v2.service';
import { Timestamp } from 'firebase/firestore';

/**
 * @deprecated Utiliser le type de telework-v2.service.ts à la place
 */
export interface RemoteWorkSchedule {
  userId: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  updatedAt: Timestamp | Date;
  updatedBy: string;
}

/**
 * @deprecated Utiliser TeleworkOverride de telework-v2.service.ts à la place
 */
export interface RemoteWorkDay {
  userId: string;
  date: Date;
  isRemote: boolean;
  note?: string;
  createdAt: Timestamp | Date;
  createdBy: string;
}

/**
 * @deprecated Ce service est déprécié. Utilisez teleworkServiceV2 à la place.
 *
 * Cette classe redirige toutes les méthodes vers teleworkServiceV2 avec des
 * adaptateurs de compatibilité pour faciliter la migration.
 */
class RemoteWorkService {
  private readonly COLLECTION_NAME = 'remoteWorkSchedules';
  private readonly DAYS_COLLECTION = 'remoteWorkDays';

  constructor() {
    console.warn(
      '⚠️ DEPRECATION WARNING: remoteWorkService est déprécié.\n' +
      'Utilisez teleworkServiceV2 à la place.\n' +
      'Ce service sera supprimé dans une version future.\n' +
      'Voir la documentation en haut du fichier pour le guide de migration.'
    );
  }

  /**
   * @deprecated Utiliser teleworkServiceV2.getSimpleRemoteSchedule() à la place
   */
  async getUserRemoteSchedule(userId: string): Promise<RemoteWorkSchedule | null> {
    console.warn('⚠️ getUserRemoteSchedule() est déprécié. Utilisez teleworkServiceV2.getSimpleRemoteSchedule()');

    const schedule = await teleworkServiceV2.getSimpleRemoteSchedule(userId);
    if (!schedule) {
      // Retourner un planning par défaut (tout en présentiel)
      return {
        userId,
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        updatedAt: new Date(),
        updatedBy: userId
      };
    }

    return {
      ...schedule,
      updatedAt: schedule.updatedAt instanceof Date ? schedule.updatedAt : new Date(schedule.updatedAt)
    };
  }

  /**
   * @deprecated Utiliser teleworkServiceV2.updateSimpleRemoteSchedule() à la place
   */
  async updateUserRemoteSchedule(
    userId: string,
    schedule: Partial<RemoteWorkSchedule>,
    updatedBy: string
  ): Promise<void> {
    console.warn('⚠️ updateUserRemoteSchedule() est déprécié. Utilisez teleworkServiceV2.updateSimpleRemoteSchedule()');

    const cleanSchedule: any = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      if (schedule[day as keyof typeof schedule] !== undefined) {
        cleanSchedule[day] = schedule[day as keyof typeof schedule];
      }
    });

    await teleworkServiceV2.updateSimpleRemoteSchedule(userId, cleanSchedule, updatedBy);
  }

  /**
   * @deprecated Utiliser teleworkServiceV2.updateSimpleRemoteSchedule() avec un seul jour à la place
   */
  async toggleDayRemoteStatus(
    userId: string,
    dayOfWeek: keyof Omit<RemoteWorkSchedule, 'userId' | 'updatedAt' | 'updatedBy'>,
    updatedBy: string
  ): Promise<boolean> {
    console.warn('⚠️ toggleDayRemoteStatus() est déprécié. Utilisez teleworkServiceV2.updateSimpleRemoteSchedule()');

    // Récupérer l'état actuel
    const currentSchedule = await this.getUserRemoteSchedule(userId);
    if (!currentSchedule) {
      throw new Error('Impossible de récupérer le planning actuel');
    }

    // Basculer l'état
    const newStatus = !currentSchedule[dayOfWeek];

    // Mettre à jour
    await this.updateUserRemoteSchedule(
      userId,
      { [dayOfWeek]: newStatus },
      updatedBy
    );

    return newStatus;
  }

  /**
   * @deprecated Utiliser teleworkServiceV2.isUserRemoteOnDate() à la place
   */
  async isUserRemoteOnDate(userId: string, date: Date): Promise<boolean> {
    console.warn('⚠️ isUserRemoteOnDate() est déprécié. Utilisez teleworkServiceV2.isUserRemoteOnDate()');
    return await teleworkServiceV2.isUserRemoteOnDate(userId, date);
  }

  /**
   * @deprecated Utiliser teleworkServiceV2.requestOverride() à la place
   */
  async setSpecificRemoteDay(
    userId: string,
    date: Date,
    isRemote: boolean,
    note: string = '',
    createdBy: string
  ): Promise<void> {
    console.warn('⚠️ setSpecificRemoteDay() est déprécié. Utilisez teleworkServiceV2.requestOverride()');

    // Créer un override via le service Telework
    await teleworkServiceV2.requestOverride({
      userId,
      date: date.toISOString().split('T')[0],
      mode: isRemote ? 'remote' : 'office',
      reason: note,
      createdBy
    } as any);
  }

  /**
   * @deprecated Utiliser teleworkServiceV2.getSimpleRemoteWorkStats() à la place
   */
  async getRemoteWorkStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalDays: number;
    remoteDays: number;
    officeDays: number;
    remotePercentage: number;
  }> {
    console.warn('⚠️ getRemoteWorkStats() est déprécié. Utilisez teleworkServiceV2.getSimpleRemoteWorkStats()');
    return await teleworkServiceV2.getSimpleRemoteWorkStats(userId, startDate, endDate);
  }

  /**
   * @deprecated Fonctionnalité temps réel non supportée dans teleworkServiceV2 (utiliser polling)
   */
  subscribeToRemoteSchedule(
    userId: string,
    callback: (schedule: RemoteWorkSchedule | null) => void
  ): () => void {
    console.warn(
      '⚠️ subscribeToRemoteSchedule() est déprécié et non supporté dans teleworkServiceV2.\n' +
      'Utilisez un polling régulier avec getSimpleRemoteSchedule() à la place.'
    );

    // Retourner une fonction de désabonnement vide
    return () => {};
  }

  /**
   * @deprecated Utiliser teleworkServiceV2.getUserOverrides() filtré par date à la place
   */
  async getSpecificRemoteDay(userId: string, date: Date): Promise<RemoteWorkDay | null> {
    console.warn('⚠️ getSpecificRemoteDay() est déprécié. Utilisez teleworkServiceV2.getUserOverrides()');

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const overrides = await teleworkServiceV2.getUserOverrides(userId, startDate, endDate);
    const override = overrides.find(o => {
      const overrideDate = typeof o.date === 'string' ? new Date(o.date) : o.date;
      return overrideDate.toDateString() === date.toDateString();
    });

    if (!override) return null;

    return {
      userId,
      date,
      isRemote: override.mode === 'remote',
      note: override.reason,
      createdAt: override.createdAt ? new Date(override.createdAt) : new Date(),
      createdBy: override.createdBy
    };
  }

  /**
   * @deprecated Utiliser teleworkServiceV2.deleteOverride() à la place
   */
  async deleteSpecificRemoteDay(userId: string, date: Date): Promise<void> {
    console.warn('⚠️ deleteSpecificRemoteDay() est déprécié. Utilisez teleworkServiceV2.deleteOverride()');

    // Trouver l'override correspondant
    const remoteDay = await this.getSpecificRemoteDay(userId, date);
    if (!remoteDay) {
      console.warn('Aucun override trouvé pour cette date');
      return;
    }

    // Générer l'ID de l'override (format utilisé par Telework)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const overrideId = `${userId}_${year}-${month}-${day}`;

    await teleworkServiceV2.deleteOverride(overrideId);
  }

  /**
   * @deprecated Fonctionnalité non implémentée
   */
  async getRemoteUsersForDate(date: Date): Promise<string[]> {
    console.warn('⚠️ getRemoteUsersForDate() est déprécié et non implémenté.');
    return [];
  }
}

export const remoteWorkService = new RemoteWorkService();
