import api from './client';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'FIXED' | 'CALCULATED' | 'CUSTOM';
  isNational: boolean;
  regions: string[];
  isWorkingDay: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayRequest {
  name: string;
  date: string;
  type: 'FIXED' | 'CALCULATED' | 'CUSTOM';
  isNational?: boolean;
  regions?: string[];
  isWorkingDay?: boolean;
}

export interface UpdateHolidayRequest {
  name?: string;
  date?: string;
  type?: 'FIXED' | 'CALCULATED' | 'CUSTOM';
  isNational?: boolean;
  regions?: string[];
  isWorkingDay?: boolean;
}

export interface GetHolidaysParams {
  year?: number;
  isNational?: boolean;
  region?: string;
}

export interface HolidayStats {
  total: number;
  byType: Record<string, number>;
  national: number;
  regional: number;
  workingDays: number;
  year: number;
}

export interface CheckHolidayResponse {
  date: string;
  region?: string;
  isHoliday: boolean;
  holiday: Holiday | null;
}

export interface WorkingDaysResponse {
  startDate: string;
  endDate: string;
  region?: string;
  workingDays: number;
}

export interface EasterDateResponse {
  year: number;
  date: string;
  day: number;
  month: number;
}

export const holidaysAPI = {
  /**
   * Récupère tous les jours fériés avec filtrage optionnel
   */
  async getAll(params?: GetHolidaysParams): Promise<Holiday[]> {
    const response = await api.get('/holidays', { params });
    return response.data || [];
  },

  /**
   * Récupère les jours fériés pour une année
   */
  async getByYear(year: number): Promise<Holiday[]> {
    const response = await api.get(`/holidays/year/${year}`);
    return response.data || [];
  },

  /**
   * Récupère les statistiques pour une année
   */
  async getStats(year: number): Promise<HolidayStats> {
    const response = await api.get(`/holidays/year/${year}/stats`);
    return response.data;
  },

  /**
   * Calcule la date de Pâques pour une année donnée
   */
  async getEasterDate(year: number): Promise<EasterDateResponse> {
    const response = await api.get(`/holidays/year/${year}/easter`);
    return response.data;
  },

  /**
   * Récupère les jours fériés pour une période
   */
  async getByPeriod(
    startDate: string,
    endDate: string,
    region?: string,
  ): Promise<Holiday[]> {
    const params: any = { startDate, endDate };
    if (region) params.region = region;
    const response = await api.get('/holidays/period', { params });
    return response.data || [];
  },

  /**
   * Vérifie si une date est un jour férié
   */
  async checkIsHoliday(
    date: string,
    region?: string,
  ): Promise<CheckHolidayResponse> {
    const params: any = { date };
    if (region) params.region = region;
    const response = await api.get('/holidays/check', { params });
    return response.data;
  },

  /**
   * Calcule le nombre de jours ouvrés entre deux dates
   */
  async getWorkingDays(
    startDate: string,
    endDate: string,
    region?: string,
  ): Promise<WorkingDaysResponse> {
    const params: any = { startDate, endDate };
    if (region) params.region = region;
    const response = await api.get('/holidays/working-days', { params });
    return response.data;
  },

  /**
   * Récupère les prochains jours fériés
   */
  async getUpcoming(limit: number = 5): Promise<Holiday[]> {
    const response = await api.get('/holidays/upcoming', {
      params: { limit },
    });
    return response.data || [];
  },

  /**
   * Récupère un jour férié par ID
   */
  async getById(id: string): Promise<Holiday> {
    const response = await api.get(`/holidays/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau jour férié
   */
  async create(data: CreateHolidayRequest): Promise<Holiday> {
    const response = await api.post('/holidays', data);
    return response.data;
  },

  /**
   * Met à jour un jour férié
   */
  async update(id: string, data: UpdateHolidayRequest): Promise<Holiday> {
    const response = await api.patch(`/holidays/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un jour férié
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/holidays/${id}`);
  },

  /**
   * Récupère les jours fériés nationaux
   */
  async getNational(year?: number): Promise<Holiday[]> {
    return this.getAll({ isNational: true, year });
  },

  /**
   * Récupère les jours fériés régionaux
   */
  async getRegional(region: string, year?: number): Promise<Holiday[]> {
    return this.getAll({ region, year });
  },
};
