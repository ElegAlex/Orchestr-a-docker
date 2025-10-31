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
    return await api.post<Skill>('/skills', data);
  },

  /**
   * Récupérer toutes les compétences avec filtres optionnels
   */
  async getAll(filters?: { category?: SkillCategory; isActive?: boolean }): Promise<Skill[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    return await api.get<Skill[]>(`/skills?${params.toString()}`);
  },

  /**
   * Récupérer une compétence par ID
   */
  async getById(id: string): Promise<Skill> {
    return await api.get<Skill>(`/skills/${id}`);
  },

  /**
   * Mettre à jour une compétence
   */
  async update(id: string, data: UpdateSkillRequest): Promise<Skill> {
    return await api.patch<Skill>(`/skills/${id}`, data);
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
    return await api.get<CategoryWithSkills[]>('/skills/categories');
  },

  // ==================== COMPÉTENCES UTILISATEURS ====================

  /**
   * Ajouter une compétence à un utilisateur
   */
  async addUserSkill(userId: string, data: CreateUserSkillRequest): Promise<UserSkill> {
    return await api.post<UserSkill>(`/skills/users/${userId}`, data);
  },

  /**
   * Récupérer les compétences d'un utilisateur
   */
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    return await api.get<UserSkill[]>(`/skills/users/${userId}`);
  },

  /**
   * Récupérer mes compétences (utilisateur connecté)
   */
  async getMySkills(): Promise<UserSkill[]> {
    return await api.get<UserSkill[]>('/skills/users/me/skills');
  },

  /**
   * Mettre à jour une compétence d'un utilisateur
   */
  async updateUserSkill(userId: string, skillId: string, data: UpdateUserSkillRequest): Promise<UserSkill> {
    return await api.patch<UserSkill>(`/skills/users/${userId}/${skillId}`, data);
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

    return await api.get(`/skills/search/users?${params.toString()}`);
  },

  // ==================== COMPÉTENCES TÂCHES ====================

  /**
   * Ajouter une compétence requise à une tâche
   */
  async addTaskSkill(taskId: string, data: CreateTaskSkillRequest): Promise<TaskSkill> {
    return await api.post<TaskSkill>(`/skills/tasks/${taskId}`, data);
  },

  /**
   * Récupérer les compétences requises pour une tâche
   */
  async getTaskSkills(taskId: string): Promise<TaskSkill[]> {
    return await api.get<TaskSkill[]>(`/skills/tasks/${taskId}`);
  },

  /**
   * Mettre à jour une exigence de compétence pour une tâche
   */
  async updateTaskSkill(taskId: string, skillId: string, data: UpdateTaskSkillRequest): Promise<TaskSkill> {
    return await api.patch<TaskSkill>(`/skills/tasks/${taskId}/${skillId}`, data);
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
    return await api.get<SkillMetrics>('/skills/metrics/all');
  },

  /**
   * Récupérer le top des compétences en demande
   */
  async getTopDemandSkills(limit: number = 10): Promise<TopDemandSkill[]> {
    return await api.get<TopDemandSkill[]>(`/skills/metrics/demand?limit=${limit}`);
  },

  /**
   * Récupérer les compétences en pénurie
   */
  async getShortageSkills(): Promise<ShortageSkill[]> {
    return await api.get<ShortageSkill[]>('/skills/metrics/shortage');
  },

  /**
   * Recommander des personnes pour une tâche
   */
  async recommendPeopleForTask(taskId: string): Promise<PersonRecommendation[]> {
    return await api.get<PersonRecommendation[]>(`/skills/recommend/task/${taskId}`);
  },

  // ==================== INITIALISATION ====================

  /**
   * Initialiser les compétences par défaut (70+ compétences)
   */
  async initializeDefaultSkills(): Promise<InitializeSkillsResponse> {
    return await api.post<InitializeSkillsResponse>('/skills/initialize');
  },
};
