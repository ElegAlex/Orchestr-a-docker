import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto, SkillCategory } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { CreateUserSkillDto, SkillLevel } from './dto/create-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';
import { CreateTaskSkillDto } from './dto/create-task-skill.dto';
import { UpdateTaskSkillDto } from './dto/update-task-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  // ==================== GESTION DES COMPÉTENCES ====================

  async create(createSkillDto: CreateSkillDto) {
    // Vérifier si la compétence existe déjà
    const existing = await this.prisma.skill.findUnique({
      where: { name: createSkillDto.name },
    });

    if (existing) {
      throw new ConflictException(`Skill with name "${createSkillDto.name}" already exists`);
    }

    return this.prisma.skill.create({
      data: createSkillDto,
    });
  }

  async findAll(filters?: { category?: SkillCategory; isActive?: boolean }) {
    return this.prisma.skill.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: {
        userSkills: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        taskSkills: {
          include: { task: { select: { id: true, title: true } } },
        },
      },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }

    return skill;
  }

  async update(id: string, updateSkillDto: UpdateSkillDto) {
    await this.findOne(id); // Vérifie l'existence

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (updateSkillDto.name) {
      const existing = await this.prisma.skill.findFirst({
        where: { name: updateSkillDto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Skill with name "${updateSkillDto.name}" already exists`);
      }
    }

    return this.prisma.skill.update({
      where: { id },
      data: updateSkillDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Vérifie l'existence

    // Supprimer les relations (CASCADE déjà configuré dans Prisma)
    return this.prisma.skill.delete({
      where: { id },
    });
  }

  // ==================== COMPÉTENCES UTILISATEURS ====================

  async addUserSkill(userId: string, createUserSkillDto: CreateUserSkillDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Vérifier que la compétence existe
    const skill = await this.prisma.skill.findUnique({
      where: { id: createUserSkillDto.skillId },
    });
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${createUserSkillDto.skillId} not found`);
    }

    // Vérifier si l'utilisateur a déjà cette compétence
    const existing = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: createUserSkillDto.skillId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User already has this skill');
    }

    return this.prisma.userSkill.create({
      data: {
        userId,
        ...createUserSkillDto,
      },
      include: { skill: true },
    });
  }

  async getUserSkills(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserSkill(userId: string, skillId: string, updateUserSkillDto: UpdateUserSkillDto) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });

    if (!userSkill) {
      throw new NotFoundException('User skill not found');
    }

    return this.prisma.userSkill.update({
      where: { userId_skillId: { userId, skillId } },
      data: updateUserSkillDto,
      include: { skill: true },
    });
  }

  async removeUserSkill(userId: string, skillId: string) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });

    if (!userSkill) {
      throw new NotFoundException('User skill not found');
    }

    return this.prisma.userSkill.delete({
      where: { userId_skillId: { userId, skillId } },
    });
  }

  async searchUsersBySkill(skillId: string, minimumLevel?: SkillLevel) {
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${skillId} not found`);
    }

    const levelOrder = { BEGINNER: 1, INTERMEDIATE: 2, EXPERT: 3 };
    const minLevelValue = minimumLevel ? levelOrder[minimumLevel] : 0;

    const userSkills = await this.prisma.userSkill.findMany({
      where: { skillId },
      include: { user: true },
    });

    // Filtrer par niveau si spécifié
    const filtered = minimumLevel
      ? userSkills.filter((us) => levelOrder[us.level] >= minLevelValue)
      : userSkills;

    return filtered.map((us) => ({
      user: us.user,
      level: us.level,
      yearsOfExperience: us.yearsOfExperience,
      lastUsedAt: us.lastUsedAt,
      certifications: us.certifications,
    }));
  }

  // ==================== COMPÉTENCES TÂCHES ====================

  async addTaskSkill(taskId: string, createTaskSkillDto: CreateTaskSkillDto) {
    // Vérifier que la tâche existe
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Vérifier que la compétence existe
    const skill = await this.prisma.skill.findUnique({
      where: { id: createTaskSkillDto.skillId },
    });
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${createTaskSkillDto.skillId} not found`);
    }

    // Vérifier si la tâche a déjà cette compétence
    const existing = await this.prisma.taskSkill.findUnique({
      where: {
        taskId_skillId: {
          taskId,
          skillId: createTaskSkillDto.skillId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Task already has this skill requirement');
    }

    return this.prisma.taskSkill.create({
      data: {
        taskId,
        ...createTaskSkillDto,
        isRequired: createTaskSkillDto.isRequired ?? true,
      },
      include: { skill: true },
    });
  }

  async getTaskSkills(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return this.prisma.taskSkill.findMany({
      where: { taskId },
      include: { skill: true },
    });
  }

  async updateTaskSkill(taskId: string, skillId: string, updateTaskSkillDto: UpdateTaskSkillDto) {
    const taskSkill = await this.prisma.taskSkill.findUnique({
      where: { taskId_skillId: { taskId, skillId } },
    });

    if (!taskSkill) {
      throw new NotFoundException('Task skill not found');
    }

    return this.prisma.taskSkill.update({
      where: { taskId_skillId: { taskId, skillId } },
      data: updateTaskSkillDto,
      include: { skill: true },
    });
  }

  async removeTaskSkill(taskId: string, skillId: string) {
    const taskSkill = await this.prisma.taskSkill.findUnique({
      where: { taskId_skillId: { taskId, skillId } },
    });

    if (!taskSkill) {
      throw new NotFoundException('Task skill not found');
    }

    return this.prisma.taskSkill.delete({
      where: { taskId_skillId: { taskId, skillId } },
    });
  }

  // ==================== MÉTRIQUES & ANALYTICS ====================

  async getMetrics() {
    const skills = await this.prisma.skill.findMany({ where: { isActive: true } });
    const userSkills = await this.prisma.userSkill.findMany({ include: { user: true } });
    const taskSkills = await this.prisma.taskSkill.findMany();

    const totalSkills = skills.length;
    const totalUserSkills = userSkills.length;
    const averageSkillsPerUser = userSkills.length > 0 ? (userSkills.length / new Set(userSkills.map((us) => us.userId)).size).toFixed(2) : 0;

    // Répartition par catégorie
    const byCategory: Record<string, number> = {};
    skills.forEach((skill) => {
      byCategory[skill.category] = (byCategory[skill.category] || 0) + 1;
    });

    // Répartition par niveau
    const byLevel: Record<string, number> = { BEGINNER: 0, INTERMEDIATE: 0, EXPERT: 0 };
    userSkills.forEach((us) => {
      byLevel[us.level]++;
    });

    return {
      totalSkills,
      totalUserSkills,
      averageSkillsPerUser: parseFloat(averageSkillsPerUser as string),
      byCategory,
      byLevel,
      totalTasksRequiringSkills: taskSkills.length,
    };
  }

  async getTopDemandSkills(limit: number = 10) {
    const taskSkills = await this.prisma.taskSkill.findMany({
      include: { skill: true, task: true },
    });

    // Compter le nombre de tâches actives par compétence
    const skillDemand: Record<string, { skill: any; count: number; tasks: any[] }> = {};

    taskSkills.forEach((ts) => {
      if (ts.task.status !== 'COMPLETED' && ts.task.status !== 'CANCELLED') {
        if (!skillDemand[ts.skillId]) {
          skillDemand[ts.skillId] = { skill: ts.skill, count: 0, tasks: [] };
        }
        skillDemand[ts.skillId].count++;
        skillDemand[ts.skillId].tasks.push({
          id: ts.task.id,
          title: ts.task.title,
          minimumLevel: ts.minimumLevel,
          isRequired: ts.isRequired,
        });
      }
    });

    return Object.values(skillDemand)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => ({
        skill: item.skill,
        demandCount: item.count,
        tasks: item.tasks,
      }));
  }

  async getShortageSkills() {
    const skills = await this.prisma.skill.findMany({ where: { isActive: true } });
    const userSkills = await this.prisma.userSkill.findMany({ include: { user: true } });
    const taskSkills = await this.prisma.taskSkill.findMany({ include: { task: true } });

    const shortages: any[] = [];

    for (const skill of skills) {
      // Compter personnes ayant la compétence
      const peopleWithSkill = userSkills.filter((us) => us.skillId === skill.id);

      // Compter tâches actives nécessitant cette compétence
      const activeTasks = taskSkills.filter(
        (ts) => ts.skillId === skill.id && ts.task.status !== 'COMPLETED' && ts.task.status !== 'CANCELLED',
      );

      if (activeTasks.length > 0) {
        const availablePeople = peopleWithSkill.length;
        const demand = activeTasks.length;
        const ratio = availablePeople / demand;

        let severityLevel: 'critical' | 'high' | 'medium' | 'low' | null = null;
        if (ratio < 0.1) severityLevel = 'critical';
        else if (ratio < 0.25) severityLevel = 'high';
        else if (ratio < 0.4) severityLevel = 'medium';
        else if (ratio < 0.5) severityLevel = 'low';

        if (severityLevel) {
          shortages.push({
            skill,
            availablePeople,
            demand,
            ratio: parseFloat(ratio.toFixed(2)),
            severity: severityLevel,
          });
        }
      }
    }

    return shortages.sort((a, b) => a.ratio - b.ratio);
  }

  async recommendPeopleForTask(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Récupérer les compétences requises pour la tâche
    const taskSkills = await this.prisma.taskSkill.findMany({
      where: { taskId },
      include: { skill: true },
    });

    if (taskSkills.length === 0) {
      throw new BadRequestException('This task has no skill requirements');
    }

    // Récupérer tous les utilisateurs avec leurs compétences
    const users = await this.prisma.user.findMany({
      include: { userSkills: { include: { skill: true } } },
    });

    const levelOrder = { BEGINNER: 1, INTERMEDIATE: 2, EXPERT: 3 };
    const recommendations: any[] = [];

    users.forEach((user) => {
      let score = 0;
      const matchedSkills: any[] = [];
      const missingSkills: any[] = [];

      taskSkills.forEach((ts) => {
        const userSkill = user.userSkills.find((us) => us.skillId === ts.skillId);

        if (userSkill) {
          const userLevel = levelOrder[userSkill.level];
          const requiredLevel = levelOrder[ts.minimumLevel];

          if (userLevel >= requiredLevel) {
            // Compétence maîtrisée au niveau requis ou plus
            score += ts.isRequired ? 2 : 1;
            matchedSkills.push({
              skill: ts.skill,
              userLevel: userSkill.level,
              requiredLevel: ts.minimumLevel,
              isRequired: ts.isRequired,
            });
          } else {
            // Compétence présente mais niveau insuffisant
            score += ts.isRequired ? 0.3 : 0.5;
            matchedSkills.push({
              skill: ts.skill,
              userLevel: userSkill.level,
              requiredLevel: ts.minimumLevel,
              isRequired: ts.isRequired,
              insufficient: true,
            });
          }
        } else {
          // Compétence manquante
          missingSkills.push({
            skill: ts.skill,
            requiredLevel: ts.minimumLevel,
            isRequired: ts.isRequired,
          });
        }
      });

      // Calculer le score sur 100
      const maxScore = taskSkills.reduce((sum, ts) => sum + (ts.isRequired ? 2 : 1), 0);
      const normalizedScore = Math.round((score / maxScore) * 100);

      recommendations.push({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        score: normalizedScore,
        matchedSkills,
        missingSkills,
      });
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  // ==================== INITIALISATION ====================

  async initializeDefaultSkills() {
    const defaultSkills = [
      // TECHNICAL (15)
      { name: 'React', category: SkillCategory.TECHNICAL },
      { name: 'TypeScript', category: SkillCategory.TECHNICAL },
      { name: 'JavaScript', category: SkillCategory.TECHNICAL },
      { name: 'Node.js', category: SkillCategory.TECHNICAL },
      { name: 'Python', category: SkillCategory.TECHNICAL },
      { name: 'Java', category: SkillCategory.TECHNICAL },
      { name: 'Docker', category: SkillCategory.TECHNICAL },
      { name: 'Kubernetes', category: SkillCategory.TECHNICAL },
      { name: 'AWS', category: SkillCategory.TECHNICAL },
      { name: 'Azure', category: SkillCategory.TECHNICAL },
      { name: 'PostgreSQL', category: SkillCategory.TECHNICAL },
      { name: 'MongoDB', category: SkillCategory.TECHNICAL },
      { name: 'Git', category: SkillCategory.TECHNICAL },
      { name: 'CI/CD', category: SkillCategory.TECHNICAL },
      { name: 'REST API', category: SkillCategory.TECHNICAL },

      // MANAGEMENT (10)
      { name: "Gestion d'équipe", category: SkillCategory.MANAGEMENT },
      { name: 'Planification projet', category: SkillCategory.MANAGEMENT },
      { name: 'Gestion de budget', category: SkillCategory.MANAGEMENT },
      { name: 'Leadership', category: SkillCategory.MANAGEMENT },
      { name: 'Gestion des risques', category: SkillCategory.MANAGEMENT },
      { name: 'Négociation', category: SkillCategory.MANAGEMENT },
      { name: 'Coaching', category: SkillCategory.MANAGEMENT },
      { name: 'Reporting', category: SkillCategory.MANAGEMENT },
      { name: 'Stratégie', category: SkillCategory.MANAGEMENT },
      { name: 'Change Management', category: SkillCategory.MANAGEMENT },

      // DOMAIN (15)
      { name: 'Secteur public', category: SkillCategory.DOMAIN },
      { name: 'Finance', category: SkillCategory.DOMAIN },
      { name: 'Ressources Humaines', category: SkillCategory.DOMAIN },
      { name: 'Marchés publics', category: SkillCategory.DOMAIN },
      { name: 'Droit administratif', category: SkillCategory.DOMAIN },
      { name: 'Comptabilité', category: SkillCategory.DOMAIN },
      { name: 'Audit', category: SkillCategory.DOMAIN },
      { name: 'Conformité', category: SkillCategory.DOMAIN },
      { name: 'Gestion administrative', category: SkillCategory.DOMAIN },
      { name: 'Relations citoyens', category: SkillCategory.DOMAIN },
      { name: 'Santé', category: SkillCategory.DOMAIN },
      { name: 'Éducation', category: SkillCategory.DOMAIN },
      { name: 'Urbanisme', category: SkillCategory.DOMAIN },
      { name: 'Environnement', category: SkillCategory.DOMAIN },
      { name: 'Sécurité', category: SkillCategory.DOMAIN },

      // METHODOLOGY (9)
      { name: 'Agile', category: SkillCategory.METHODOLOGY },
      { name: 'Scrum', category: SkillCategory.METHODOLOGY },
      { name: 'Kanban', category: SkillCategory.METHODOLOGY },
      { name: 'Waterfall', category: SkillCategory.METHODOLOGY },
      { name: 'PMBOK', category: SkillCategory.METHODOLOGY },
      { name: 'PRINCE2', category: SkillCategory.METHODOLOGY },
      { name: 'DevOps', category: SkillCategory.METHODOLOGY },
      { name: 'Lean', category: SkillCategory.METHODOLOGY },
      { name: 'Six Sigma', category: SkillCategory.METHODOLOGY },

      // SOFT (10)
      { name: 'Communication', category: SkillCategory.SOFT },
      { name: "Travail d'équipe", category: SkillCategory.SOFT },
      { name: 'Résolution de problèmes', category: SkillCategory.SOFT },
      { name: 'Créativité', category: SkillCategory.SOFT },
      { name: 'Adaptabilité', category: SkillCategory.SOFT },
      { name: 'Autonomie', category: SkillCategory.SOFT },
      { name: 'Rigueur', category: SkillCategory.SOFT },
      { name: 'Gestion du temps', category: SkillCategory.SOFT },
      { name: "Esprit d'initiative", category: SkillCategory.SOFT },
      { name: 'Empathie', category: SkillCategory.SOFT },

      // LANGUAGE (8)
      { name: 'Français', category: SkillCategory.LANGUAGE },
      { name: 'Anglais', category: SkillCategory.LANGUAGE },
      { name: 'Espagnol', category: SkillCategory.LANGUAGE },
      { name: 'Allemand', category: SkillCategory.LANGUAGE },
      { name: 'Italien', category: SkillCategory.LANGUAGE },
      { name: 'Chinois Mandarin', category: SkillCategory.LANGUAGE },
      { name: 'Arabe', category: SkillCategory.LANGUAGE },
      { name: 'Portugais', category: SkillCategory.LANGUAGE },
    ];

    const created: any[] = [];
    const skipped: string[] = [];

    for (const skillData of defaultSkills) {
      const existing = await this.prisma.skill.findUnique({
        where: { name: skillData.name },
      });

      if (!existing) {
        const skill = await this.prisma.skill.create({ data: skillData });
        created.push(skill);
      } else {
        skipped.push(skillData.name);
      }
    }

    return {
      created: created.length,
      skipped: skipped.length,
      total: defaultSkills.length,
      createdSkills: created,
      skippedSkills: skipped,
    };
  }

  async getCategories() {
    const skills = await this.prisma.skill.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const byCategory: Record<string, any[]> = {
      TECHNICAL: [],
      MANAGEMENT: [],
      DOMAIN: [],
      METHODOLOGY: [],
      SOFT: [],
      LANGUAGE: [],
    };

    skills.forEach((skill) => {
      byCategory[skill.category].push(skill);
    });

    return Object.entries(byCategory).map(([category, skills]) => ({
      category,
      count: skills.length,
      skills,
    }));
  }
}
