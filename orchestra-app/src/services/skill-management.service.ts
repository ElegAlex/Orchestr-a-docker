import { skillsAPI, SkillCategory, SkillLevel, Skill, UserSkill, TaskSkill } from './api/skills.api';

/**
 * Service de gestion des compétences (migré vers REST API)
 *
 * Ce service remplace l'ancienne implémentation Firebase
 * Backup disponible dans skill-management.service.ts.firebase-backup
 */
class SkillManagementService {
  // Cache local pour améliorer les performances
  private skillsCache: Map<string, Skill> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  // ==================== GESTION DES COMPÉTENCES ====================

  /**
   * Initialise les compétences par défaut (70+ compétences)
   */
  async initializeDefaultSkills(): Promise<{ created: number; skipped: number }> {
    try {
      const response = await skillsAPI.initializeDefaultSkills();

      // Vérifier que la réponse est valide
      if (!response || typeof response.created === 'undefined') {
        console.warn('⚠️ Réponse invalide de l\'API skills/initialize');
        return { created: 0, skipped: 0 };
      }

      console.log(`✅ ${response.created} compétences créées, ${response.skipped} déjà existantes`);

      // Invalider le cache
      this.skillsCache.clear();
      this.lastCacheUpdate = 0;

      return { created: response.created, skipped: response.skipped };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des compétences:', error);
      // Ne pas throw l'erreur - retourner des valeurs par défaut
      return { created: 0, skipped: 0 };
    }
  }

  /**
   * Récupère toutes les compétences actives
   */
  async getAllSkills(useCache = true): Promise<Skill[]> {
    const now = Date.now();

    // Vérifier le cache
    if (useCache && this.skillsCache.size > 0 && now - this.lastCacheUpdate < this.cacheExpiry) {
      return Array.from(this.skillsCache.values());
    }

    // Récupérer depuis l'API
    const skills = await skillsAPI.getAll({ isActive: true });

    // Vérifier que skills est un tableau
    if (!Array.isArray(skills)) {
      console.warn('⚠️ skills.getAll() n\'a pas retourné un tableau:', skills);
      return [];
    }

    // Mettre à jour le cache
    this.skillsCache.clear();
    skills.forEach((skill) => this.skillsCache.set(skill.id, skill));
    this.lastCacheUpdate = now;

    return skills;
  }

  /**
   * Récupère les compétences par catégorie
   */
  async getSkillsByCategory(category: SkillCategory): Promise<Skill[]> {
    return await skillsAPI.getAll({ category, isActive: true });
  }

  /**
   * Récupère les catégories avec leurs compétences
   */
  async getCategories() {
    return await skillsAPI.getCategories();
  }

  /**
   * Crée une nouvelle compétence
   */
  async createSkill(data: { name: string; category: SkillCategory; description?: string }): Promise<Skill> {
    const skill = await skillsAPI.create(data);

    // Invalider le cache
    this.skillsCache.clear();
    this.lastCacheUpdate = 0;

    return skill;
  }

  /**
   * Met à jour une compétence
   */
  async updateSkill(
    skillId: string,
    data: { name?: string; category?: SkillCategory; description?: string; isActive?: boolean },
  ): Promise<Skill> {
    const skill = await skillsAPI.update(skillId, data);

    // Mettre à jour le cache
    this.skillsCache.set(skill.id, skill);

    return skill;
  }

  /**
   * Supprime une compétence
   */
  async deleteSkill(skillId: string): Promise<void> {
    await skillsAPI.delete(skillId);

    // Retirer du cache
    this.skillsCache.delete(skillId);
  }

  /**
   * Désactive une compétence (soft delete)
   */
  async deactivateSkill(skillId: string): Promise<Skill> {
    return await this.updateSkill(skillId, { isActive: false });
  }

  // ==================== COMPÉTENCES UTILISATEURS ====================

  /**
   * Récupère les compétences d'un utilisateur
   */
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    return await skillsAPI.getUserSkills(userId);
  }

  /**
   * Récupère mes compétences (utilisateur connecté)
   */
  async getMySkills(): Promise<UserSkill[]> {
    return await skillsAPI.getMySkills();
  }

  /**
   * Ajoute une compétence à un utilisateur
   */
  async addUserSkill(
    userId: string,
    data: {
      skillId: string;
      level: SkillLevel;
      yearsOfExperience?: number;
      certifications?: string[];
      notes?: string;
    },
  ): Promise<UserSkill> {
    return await skillsAPI.addUserSkill(userId, data);
  }

  /**
   * Met à jour le niveau de compétence d'un utilisateur
   */
  async updateUserSkill(
    userId: string,
    skillId: string,
    data: {
      level?: SkillLevel;
      yearsOfExperience?: number;
      lastUsedAt?: string;
      certifications?: string[];
      notes?: string;
    },
  ): Promise<UserSkill> {
    return await skillsAPI.updateUserSkill(userId, skillId, data);
  }

  /**
   * Retire une compétence d'un utilisateur
   */
  async removeUserSkill(userId: string, skillId: string): Promise<void> {
    await skillsAPI.removeUserSkill(userId, skillId);
  }

  /**
   * Recherche des utilisateurs ayant une compétence spécifique
   */
  async searchUsersBySkill(skillId: string, minimumLevel?: SkillLevel) {
    return await skillsAPI.searchUsersBySkill(skillId, minimumLevel);
  }

  // ==================== COMPÉTENCES TÂCHES ====================

  /**
   * Récupère les compétences requises pour une tâche
   */
  async getTaskSkills(taskId: string): Promise<TaskSkill[]> {
    return await skillsAPI.getTaskSkills(taskId);
  }

  /**
   * Ajoute une compétence requise à une tâche
   */
  async addTaskSkill(
    taskId: string,
    data: {
      skillId: string;
      minimumLevel: SkillLevel;
      isRequired?: boolean;
    },
  ): Promise<TaskSkill> {
    return await skillsAPI.addTaskSkill(taskId, data);
  }

  /**
   * Met à jour les exigences de compétence d'une tâche
   */
  async updateTaskSkill(
    taskId: string,
    skillId: string,
    data: {
      minimumLevel?: SkillLevel;
      isRequired?: boolean;
    },
  ): Promise<TaskSkill> {
    return await skillsAPI.updateTaskSkill(taskId, skillId, data);
  }

  /**
   * Retire une compétence requise d'une tâche
   */
  async removeTaskSkill(taskId: string, skillId: string): Promise<void> {
    await skillsAPI.removeTaskSkill(taskId, skillId);
  }

  // ==================== RECOMMANDATIONS & ANALYTICS ====================

  /**
   * Recommande des personnes pour une tâche en fonction des compétences
   */
  async recommendPeopleForTask(taskId: string) {
    return await skillsAPI.recommendPeopleForTask(taskId);
  }

  /**
   * Récupère les métriques globales sur les compétences
   */
  async getMetrics() {
    return await skillsAPI.getMetrics();
  }

  /**
   * Récupère le top des compétences en demande
   */
  async getTopDemandSkills(limit: number = 10) {
    return await skillsAPI.getTopDemandSkills(limit);
  }

  /**
   * Récupère les compétences en pénurie
   */
  async getShortageSkills() {
    return await skillsAPI.getShortageSkills();
  }

  // ==================== HELPERS ====================

  /**
   * Vérifie si un utilisateur possède une compétence au niveau requis
   */
  async userHasSkill(userId: string, skillId: string, minimumLevel: SkillLevel = SkillLevel.BEGINNER): Promise<boolean> {
    const userSkills = await this.getUserSkills(userId);
    const userSkill = userSkills.find((us) => us.skillId === skillId);

    if (!userSkill) return false;

    const levelOrder = { BEGINNER: 1, INTERMEDIATE: 2, EXPERT: 3 };
    return levelOrder[userSkill.level] >= levelOrder[minimumLevel];
  }

  /**
   * Calcule le score de correspondance entre un utilisateur et une tâche
   */
  async calculateUserTaskMatch(userId: string, taskId: string): Promise<number> {
    const taskSkills = await this.getTaskSkills(taskId);
    const userSkills = await this.getUserSkills(userId);

    if (taskSkills.length === 0) return 0;

    let score = 0;
    const levelOrder = { BEGINNER: 1, INTERMEDIATE: 2, EXPERT: 3 };

    taskSkills.forEach((ts) => {
      const userSkill = userSkills.find((us) => us.skillId === ts.skillId);

      if (userSkill) {
        const userLevel = levelOrder[userSkill.level];
        const requiredLevel = levelOrder[ts.minimumLevel];

        if (userLevel >= requiredLevel) {
          score += ts.isRequired ? 2 : 1;
        } else {
          score += 0.3;
        }
      }
    });

    const maxScore = taskSkills.reduce((sum, ts) => sum + (ts.isRequired ? 2 : 1), 0);
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Invalide le cache
   */
  clearCache(): void {
    this.skillsCache.clear();
    this.lastCacheUpdate = 0;
  }
}

// Export as both named and default for compatibility
const skillManagementService = new SkillManagementService();
export { skillManagementService };
export default skillManagementService;
