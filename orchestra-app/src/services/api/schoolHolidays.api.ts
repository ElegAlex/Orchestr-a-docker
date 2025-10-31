import api from './client';

export interface SchoolHoliday {
  id: string;
  name: string;
  period: 'TOUSSAINT' | 'NOEL' | 'HIVER' | 'PRINTEMPS' | 'ETE';
  zone: 'A' | 'B' | 'C' | 'ALL';
  startDate: string;
  endDate: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolHolidayRequest {
  name: string;
  period: 'TOUSSAINT' | 'NOEL' | 'HIVER' | 'PRINTEMPS' | 'ETE';
  zone: 'A' | 'B' | 'C' | 'ALL';
  startDate: string;
  endDate: string;
  year: number;
}

export interface UpdateSchoolHolidayRequest {
  name?: string;
  period?: 'TOUSSAINT' | 'NOEL' | 'HIVER' | 'PRINTEMPS' | 'ETE';
  zone?: 'A' | 'B' | 'C' | 'ALL';
  startDate?: string;
  endDate?: string;
  year?: number;
}

export interface GetSchoolHolidaysParams {
  year?: number;
  zone?: 'A' | 'B' | 'C' | 'ALL';
  period?: 'TOUSSAINT' | 'NOEL' | 'HIVER' | 'PRINTEMPS' | 'ETE';
}

export interface SchoolHolidayStats {
  total: number;
  byPeriod: Record<string, number>;
  byZone: Record<string, number>;
  schoolYear: number;
}

export interface CheckSchoolHolidayResponse {
  date: string;
  zone?: 'A' | 'B' | 'C' | 'ALL';
  isSchoolHoliday: boolean;
}

export const schoolHolidaysAPI = {
  /**
   * Récupère tous les congés scolaires avec filtrage optionnel
   */
  async getAll(params?: GetSchoolHolidaysParams): Promise<SchoolHoliday[]> {
    const response = await api.get('/school-holidays', { params });
    return response.data || [];
  },

  /**
   * Récupère les congés scolaires pour une année
   */
  async getByYear(year: number): Promise<SchoolHoliday[]> {
    const response = await api.get(`/school-holidays/year/${year}`);
    return response.data || [];
  },

  /**
   * Récupère les statistiques pour une année
   */
  async getStats(year: number): Promise<SchoolHolidayStats> {
    const response = await api.get(`/school-holidays/year/${year}/stats`);
    return response.data;
  },

  /**
   * Récupère les congés scolaires pour une période
   */
  async getByPeriod(
    startDate: string,
    endDate: string,
    zone?: 'A' | 'B' | 'C' | 'ALL',
  ): Promise<SchoolHoliday[]> {
    const params: any = { startDate, endDate };
    if (zone) params.zone = zone;
    const response = await api.get('/school-holidays/period', { params });
    return response.data || [];
  },

  /**
   * Vérifie si une date est un congé scolaire
   */
  async checkIsSchoolHoliday(
    date: string,
    zone?: 'A' | 'B' | 'C' | 'ALL',
  ): Promise<CheckSchoolHolidayResponse> {
    const params: any = { date };
    if (zone) params.zone = zone;
    const response = await api.get('/school-holidays/check', { params });
    return response.data;
  },

  /**
   * Récupère un congé scolaire par ID
   */
  async getById(id: string): Promise<SchoolHoliday> {
    const response = await api.get(`/school-holidays/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau congé scolaire
   */
  async create(data: CreateSchoolHolidayRequest): Promise<SchoolHoliday> {
    const response = await api.post('/school-holidays', data);
    return response.data;
  },

  /**
   * Met à jour un congé scolaire
   */
  async update(
    id: string,
    data: UpdateSchoolHolidayRequest,
  ): Promise<SchoolHoliday> {
    const response = await api.patch(`/school-holidays/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un congé scolaire
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/school-holidays/${id}`);
  },

  /**
   * Récupère les congés scolaires par zone
   */
  async getByZone(
    zone: 'A' | 'B' | 'C' | 'ALL',
    year?: number,
  ): Promise<SchoolHoliday[]> {
    return this.getAll({ zone, year });
  },

  /**
   * Récupère les congés scolaires par période
   */
  async getByPeriodType(
    period: 'TOUSSAINT' | 'NOEL' | 'HIVER' | 'PRINTEMPS' | 'ETE',
    year?: number,
  ): Promise<SchoolHoliday[]> {
    return this.getAll({ period, year });
  },
};
