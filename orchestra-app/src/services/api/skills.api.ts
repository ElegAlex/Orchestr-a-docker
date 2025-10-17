import api from './client';

// ==================== TYPES ====================

export enum SkillCategory {
  TECHNICAL = 'TECHNICAL',
  MANAGEMENT = 'MANAGEMENT',
  DOMAIN = 'DOMAIN',
  METHODOLOGY = 'METHODOLOGY',
  SOFT = 'SOFT',
  LANGUAGE = 'LANGUAGE',
}

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skill: Skill;
  level: SkillLevel;
  yearsOfExperience?: number;
  lastUsedAt?: string;
  certifications?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSkill {
  id: string;
  taskId: string;
  skillId: string;
  skill: Skill;
  minimumLevel: SkillLevel;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillRequest {
  name: string;
  category: SkillCategory;
  description?: string;
}

export interface UpdateSkillRequest {
  name?: string;
  category?: SkillCategory;
  description?: string;
  isActive?: boolean;
}

export interface CreateUserSkillRequest {
  skillId: string;
  level: SkillLevel;
  yearsOfExperience?: number;
  lastUsedAt?: string;
  certifications?: string[];
  notes?: string;
}

export interface UpdateUserSkillRequest {
  level?: SkillLevel;
  yearsOfExperience?: number;
  lastUsedAt?: string;
  certifications?: string[];
  notes?: string;
}

export interface CreateTaskSkillRequest {
  skillId: string;
  minimumLevel: SkillLevel;
  isRequired?: boolean;
}

export interface UpdateTaskSkillRequest {
  minimumLevel?: SkillLevel;
  isRequired?: boolean;
}

export interface SkillMetrics {
  totalSkills: number;
  totalUserSkills: number;
  averageSkillsPerUser: number;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  totalTasksRequiringSkills: number;
}

export interface TopDemandSkill {
  skill: Skill;
  demandCount: number;
  tasks: Array<{
    id: string;
    title: string;
    minimumLevel: SkillLevel;
    isRequired: boolean;
  }>;
}

export interface ShortageSkill {
  skill: Skill;
  availablePeople: number;
  demand: number;
  ratio: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PersonRecommendation {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  score: number;
  matchedSkills: Array<{
    skill: Skill;
    userLevel: SkillLevel;
    requiredLevel: SkillLevel;
    isRequired: boolean;
    insufficient?: boolean;
  }>;
  missingSkills: Array<{
    skill: Skill;
    requiredLevel: SkillLevel;
    isRequired: boolean;
  }>;
}

export interface CategoryWithSkills {
  category: string;
  count: number;
  skills: Skill[];
}

export interface InitializeSkillsResponse {
  created: number;
  skipped: number;
  total: number;
  createdSkills: Skill[];
  skippedSkills: string[];
}

// ==================== API CLIENT ====================

export const skillsAPI = {
  // ==================== GESTION DES COMPÉTENCES ====================

  /**
   * Créer une nouvelle compétence
   */
  async create(data: CreateSkillRequest): Promise<Skill> {
    const response = await api.post<Skill>('/skills', data);
    return response.data;
  },

  /**
   * Récupérer toutes les compétences avec filtres optionnels
   */
  async getAll(filters?: { category?: SkillCategory; isActive?: boolean }): Promise<Skill[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const response = await api.get<Skill[]>(`/skills?${params.toString()}`);
    return response.data;
  },

  /**
   * Récupérer une compétence par ID
   */
  async getById(id: string): Promise<Skill> {
    const response = await api.get<Skill>(`/skills/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour une compétence
   */
  async update(id: string, data: UpdateSkillRequest): Promise<Skill> {
    const response = await api.patch<Skill>(`/skills/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer une compétence
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/skills/${id}`);
  },

  /**
   * Récupérer les catégories avec leurs compétences
   */
  async getCategories(): Promise<CategoryWithSkills[]> {
    const response = await api.get<CategoryWithSkills[]>('/skills/categories');
    return response.data;
  },

  // ==================== COMPÉTENCES UTILISATEURS ====================

  /**
   * Ajouter une compétence à un utilisateur
   */
  async addUserSkill(userId: string, data: CreateUserSkillRequest): Promise<UserSkill> {
    const response = await api.post<UserSkill>(`/skills/users/${userId}`, data);
    return response.data;
  },

  /**
   * Récupérer les compétences d'un utilisateur
   */
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    const response = await api.get<UserSkill[]>(`/skills/users/${userId}`);
    return response.data;
  },

  /**
   * Récupérer mes compétences (utilisateur connecté)
   */
  async getMySkills(): Promise<UserSkill[]> {
    const response = await api.get<UserSkill[]>('/skills/users/me/skills');
    return response.data;
  },

  /**
   * Mettre à jour une compétence d'un utilisateur
   */
  async updateUserSkill(userId: string, skillId: string, data: UpdateUserSkillRequest): Promise<UserSkill> {
    const response = await api.patch<UserSkill>(`/skills/users/${userId}/${skillId}`, data);
    return response.data;
  },

  /**
   * Retirer une compétence d'un utilisateur
   */
  async removeUserSkill(userId: string, skillId: string): Promise<void> {
    await api.delete(`/skills/users/${userId}/${skillId}`);
  },

  /**
   * Rechercher des utilisateurs ayant une compétence
   */
  async searchUsersBySkill(
    skillId: string,
    minimumLevel?: SkillLevel,
  ): Promise<
    Array<{
      user: any;
      level: SkillLevel;
      yearsOfExperience?: number;
      lastUsedAt?: string;
      certifications?: string[];
    }>
  > {
    const params = new URLSearchParams({ skillId });
    if (minimumLevel) params.append('minimumLevel', minimumLevel);

    const response = await api.get(`/skills/search/users?${params.toString()}`);
    return response.data;
  },

  // ==================== COMPÉTENCES TÂCHES ====================

  /**
   * Ajouter une compétence requise à une tâche
   */
  async addTaskSkill(taskId: string, data: CreateTaskSkillRequest): Promise<TaskSkill> {
    const response = await api.post<TaskSkill>(`/skills/tasks/${taskId}`, data);
    return response.data;
  },

  /**
   * Récupérer les compétences requises pour une tâche
   */
  async getTaskSkills(taskId: string): Promise<TaskSkill[]> {
    const response = await api.get<TaskSkill[]>(`/skills/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Mettre à jour une exigence de compétence pour une tâche
   */
  async updateTaskSkill(taskId: string, skillId: string, data: UpdateTaskSkillRequest): Promise<TaskSkill> {
    const response = await api.patch<TaskSkill>(`/skills/tasks/${taskId}/${skillId}`, data);
    return response.data;
  },

  /**
   * Retirer une compétence requise d'une tâche
   */
  async removeTaskSkill(taskId: string, skillId: string): Promise<void> {
    await api.delete(`/skills/tasks/${taskId}/${skillId}`);
  },

  // ==================== MÉTRIQUES & ANALYTICS ====================

  /**
   * Récupérer les métriques globales sur les compétences
   */
  async getMetrics(): Promise<SkillMetrics> {
    const response = await api.get<SkillMetrics>('/skills/metrics/all');
    return response.data;
  },

  /**
   * Récupérer le top des compétences en demande
   */
  async getTopDemandSkills(limit: number = 10): Promise<TopDemandSkill[]> {
    const response = await api.get<TopDemandSkill[]>(`/skills/metrics/demand?limit=${limit}`);
    return response.data;
  },

  /**
   * Récupérer les compétences en pénurie
   */
  async getShortageSkills(): Promise<ShortageSkill[]> {
    const response = await api.get<ShortageSkill[]>('/skills/metrics/shortage');
    return response.data;
  },

  /**
   * Recommander des personnes pour une tâche
   */
  async recommendPeopleForTask(taskId: string): Promise<PersonRecommendation[]> {
    const response = await api.get<PersonRecommendation[]>(`/skills/recommend/task/${taskId}`);
    return response.data;
  },

  // ==================== INITIALISATION ====================

  /**
   * Initialiser les compétences par défaut (70+ compétences)
   */
  async initializeDefaultSkills(): Promise<InitializeSkillsResponse> {
    const response = await api.post<InitializeSkillsResponse>('/skills/initialize');
    return response.data;
  },
};
