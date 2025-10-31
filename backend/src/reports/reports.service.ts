import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, ExportFormat } from './dto/create-report.dto';
import { UpdateReportDto, ReportStatus } from './dto/update-report.dto';
import { ReportType } from '@prisma/client';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';
import { Readable } from 'stream';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée un nouveau rapport
   */
  async create(createReportDto: CreateReportDto, userId: string) {
    const report = await this.prisma.report.create({
      data: {
        name: createReportDto.name,
        type: createReportDto.type,
        description: createReportDto.description,
        parameters: createReportDto.parameters,
        template: createReportDto.template,
        format: createReportDto.format,
        startDate: createReportDto.startDate ? new Date(createReportDto.startDate) : null,
        endDate: createReportDto.endDate ? new Date(createReportDto.endDate) : null,
        isPublic: createReportDto.isPublic ?? false,
        sharedWith: createReportDto.sharedWith ?? [],
        expiresAt: createReportDto.expiresAt ? new Date(createReportDto.expiresAt) : null,
        status: 'PENDING',
        user: {
          connect: { id: userId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Lancer la génération en arrière-plan (asynchrone)
    this.generateReport(report.id).catch((error) => {
      console.error(`Failed to generate report ${report.id}:`, error);
    });

    return report;
  }

  /**
   * Récupère tous les rapports (avec filtres optionnels)
   */
  async findAll(filters?: {
    type?: ReportType;
    status?: ReportStatus;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.userId) {
      where.generatedBy = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupère un rapport par ID
   */
  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  /**
   * Met à jour un rapport
   */
  async update(id: string, updateReportDto: UpdateReportDto) {
    await this.findOne(id); // Vérifie l'existence

    return this.prisma.report.update({
      where: { id },
      data: updateReportDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Supprime un rapport
   */
  async remove(id: string) {
    await this.findOne(id); // Vérifie l'existence

    return this.prisma.report.delete({
      where: { id },
    });
  }

  /**
   * Génère un rapport (méthode principale)
   */
  async generateReport(reportId: string) {
    const report = await this.findOne(reportId);

    try {
      // Marquer comme en cours de génération
      await this.update(reportId, { status: ReportStatus.GENERATING });

      // Récupérer les données selon le type de rapport
      const data = await this.fetchReportData(report.type, report.parameters);

      // Générer le contenu selon le format
      let fileBuffer: Buffer;
      let mimeType: string;
      let filename: string;

      switch (report.format) {
        case ExportFormat.PDF:
          fileBuffer = await this.generatePDF(report, data);
          mimeType = 'application/pdf';
          filename = `${report.name.replace(/\s+/g, '_')}.pdf`;
          break;

        case ExportFormat.EXCEL:
          fileBuffer = await this.generateExcel(report, data);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `${report.name.replace(/\s+/g, '_')}.xlsx`;
          break;

        case ExportFormat.CSV:
          fileBuffer = await this.generateCSV(report, data);
          mimeType = 'text/csv';
          filename = `${report.name.replace(/\s+/g, '_')}.csv`;
          break;

        case ExportFormat.JSON:
          fileBuffer = Buffer.from(JSON.stringify(data, null, 2));
          mimeType = 'application/json';
          filename = `${report.name.replace(/\s+/g, '_')}.json`;
          break;

        default:
          throw new BadRequestException(`Unsupported format: ${report.format}`);
      }

      // Dans une vraie implémentation, on uploadera le fichier vers MinIO
      // Pour l'instant, on stocke juste les métadonnées
      const filepath = `/reports/${reportId}/${filename}`;

      // Générer le résumé
      const summary = this.generateSummary(report.type, data);

      // Mettre à jour le rapport avec les infos de fichier
      return await this.update(reportId, {
        status: ReportStatus.COMPLETED,
        filename,
        filepath,
        filesize: fileBuffer.length,
        mimeType,
        summary,
        generatedAt: new Date().toISOString(),
      } as any);
    } catch (error) {
      // En cas d'erreur, marquer le rapport comme échoué
      await this.update(reportId, {
        status: ReportStatus.FAILED,
        errors: { message: error.message, stack: error.stack },
      } as any);

      throw error;
    }
  }

  /**
   * Récupère les données du rapport selon son type
   */
  private async fetchReportData(type: ReportType, parameters: any) {
    const { startDate, endDate, projectId, userId, departmentId } = parameters;

    switch (type) {
      case ReportType.PROJECT_SUMMARY:
        return this.fetchProjectSummaryData(projectId, startDate, endDate);

      case ReportType.TASK_ANALYSIS:
        return this.fetchTaskAnalysisData(projectId, startDate, endDate);

      case ReportType.RESOURCE_UTILIZATION:
        return this.fetchResourceUtilizationData(startDate, endDate, departmentId);

      case ReportType.LEAVE_SUMMARY:
        return this.fetchLeaveSummaryData(startDate, endDate, departmentId);

      case ReportType.SKILL_MATRIX:
        return this.fetchSkillMatrixData(departmentId);

      case ReportType.CUSTOM:
        return this.fetchCustomData(parameters);

      default:
        throw new BadRequestException(`Unsupported report type: ${type}`);
    }
  }

  /**
   * Données pour rapport PROJECT_SUMMARY
   */
  private async fetchProjectSummaryData(projectId?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (projectId) {
      where.id = projectId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          },
        },
      },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      dueDate: project.dueDate,
      budget: project.budget,
      tasksCount: project.tasks.length,
      tasksCompleted: project.tasks.filter((t) => t.status === 'COMPLETED').length,
      membersCount: project.members.length,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  }

  /**
   * Données pour rapport TASK_ANALYSIS
   */
  private async fetchTaskAnalysisData(projectId?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        assignee: task.assignee,
        project: task.project,
      })),
      stats: {
        total: tasks.length,
        byStatus: this.groupByField(tasks, 'status'),
        byPriority: this.groupByField(tasks, 'priority'),
        totalEstimatedHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
        totalActualHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      },
    };
  }

  /**
   * Données pour rapport RESOURCE_UTILIZATION
   */
  private async fetchResourceUtilizationData(startDate?: string, endDate?: string, departmentId?: string) {
    const where: any = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        tasks: {
          where: {
            ...(startDate || endDate
              ? {
                  createdAt: {
                    ...(startDate ? { gte: new Date(startDate) } : {}),
                    ...(endDate ? { lte: new Date(endDate) } : {}),
                  },
                }
              : {}),
          },
        },
        department: { select: { id: true, name: true } },
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      department: user.department,
      tasksCount: user.tasks.length,
      tasksCompleted: user.tasks.filter((t) => t.status === 'COMPLETED').length,
      estimatedHours: user.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      actualHours: user.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
    }));
  }

  /**
   * Données pour rapport LEAVE_SUMMARY
   */
  private async fetchLeaveSummaryData(startDate?: string, endDate?: string, departmentId?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const leaves = await this.prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Filtrer par département si nécessaire
    const filteredLeaves = departmentId
      ? leaves.filter((l) => l.user.department?.id === departmentId)
      : leaves;

    return {
      leaves: filteredLeaves.map((leave) => ({
        id: leave.id,
        type: leave.type,
        status: leave.status,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
        reason: leave.reason,
        user: {
          id: leave.user.id,
          name: `${leave.user.firstName} ${leave.user.lastName}`,
          email: leave.user.email,
          department: leave.user.department,
        },
      })),
      stats: {
        total: filteredLeaves.length,
        byType: this.groupByField(filteredLeaves, 'type'),
        byStatus: this.groupByField(filteredLeaves, 'status'),
        totalDays: filteredLeaves.reduce((sum, l) => sum + (l.days ? Number(l.days) : 0), 0),
      },
    };
  }

  /**
   * Données pour rapport SKILL_MATRIX
   */
  private async fetchSkillMatrixData(departmentId?: string) {
    const where: any = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        userSkills: {
          include: {
            skill: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
    });

    const allSkills = await this.prisma.skill.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return {
      users: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        department: user.department,
        skills: user.userSkills.map((us) => ({
          skillId: us.skillId,
          skillName: us.skill.name,
          category: us.skill.category,
          level: us.level,
          yearsOfExperience: us.yearsOfExperience,
        })),
      })),
      allSkills: allSkills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
      })),
    };
  }

  /**
   * Données personnalisées
   */
  private async fetchCustomData(parameters: any) {
    // Logique personnalisée selon les paramètres
    return { message: 'Custom report data', parameters };
  }

  /**
   * Génère un PDF
   */
  private async generatePDF(report: any, data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // En-tête
        doc.fontSize(20).text(report.name, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Type: ${report.type}`, { align: 'left' });
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'left' });
        doc.moveDown();

        // Contenu selon le type
        doc.fontSize(14).text('Données du rapport:', { underline: true });
        doc.moveDown();
        doc.fontSize(10).text(JSON.stringify(data, null, 2), { align: 'left' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Génère un fichier Excel
   */
  private async generateExcel(report: any, data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // En-tête
    worksheet.addRow(['Rapport:', report.name]);
    worksheet.addRow(['Type:', report.type]);
    worksheet.addRow(['Généré le:', new Date().toLocaleDateString('fr-FR')]);
    worksheet.addRow([]);

    // Données (exemple simple - à adapter selon le type)
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);
        data.forEach((row) => {
          worksheet.addRow(headers.map((h) => row[h]));
        });
      }
    } else if (data.tasks) {
      // Cas TASK_ANALYSIS
      worksheet.addRow(['ID', 'Titre', 'Statut', 'Priorité', 'Progression']);
      data.tasks.forEach((task: any) => {
        worksheet.addRow([task.id, task.title, task.status, task.priority, task.progress]);
      });
    } else {
      worksheet.addRow(['Données brutes:']);
      worksheet.addRow([JSON.stringify(data, null, 2)]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Génère un CSV
   */
  private async generateCSV(report: any, data: any): Promise<Buffer> {
    let records: any[] = [];

    if (Array.isArray(data)) {
      records = data;
    } else if (data.tasks) {
      records = data.tasks;
    } else if (data.leaves) {
      records = data.leaves;
    } else if (data.users) {
      records = data.users;
    } else {
      records = [data];
    }

    const csv = stringify(records, { header: true });
    return Buffer.from(csv);
  }

  /**
   * Génère un résumé du rapport
   */
  private generateSummary(type: ReportType, data: any): any {
    const summary: any = {
      type,
      generatedAt: new Date().toISOString(),
    };

    switch (type) {
      case ReportType.PROJECT_SUMMARY:
        summary.projectsCount = Array.isArray(data) ? data.length : 0;
        summary.totalTasks = Array.isArray(data)
          ? data.reduce((sum: number, p: any) => sum + (p.tasksCount || 0), 0)
          : 0;
        break;

      case ReportType.TASK_ANALYSIS:
        summary.tasksCount = data.stats?.total || 0;
        summary.byStatus = data.stats?.byStatus || {};
        break;

      case ReportType.RESOURCE_UTILIZATION:
        summary.usersCount = Array.isArray(data) ? data.length : 0;
        break;

      case ReportType.LEAVE_SUMMARY:
        summary.leavesCount = data.stats?.total || 0;
        summary.totalDays = data.stats?.totalDays || 0;
        break;

      case ReportType.SKILL_MATRIX:
        summary.usersCount = data.users?.length || 0;
        summary.skillsCount = data.allSkills?.length || 0;
        break;
    }

    return summary;
  }

  /**
   * Utilitaire pour grouper par champ
   */
  private groupByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[field] || 'UNKNOWN';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Récupère les rapports d'un utilisateur
   */
  async findByUser(userId: string) {
    return this.prisma.report.findMany({
      where: { generatedBy: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Télécharge le contenu d'un rapport
   * (Dans une vraie implémentation, cela récupérerait le fichier depuis MinIO)
   */
  async downloadReport(id: string): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const report = await this.findOne(id);

    if (report.status !== ReportStatus.COMPLETED) {
      throw new BadRequestException('Report is not ready for download');
    }

    if (!report.filename) {
      throw new NotFoundException('Report file not found');
    }

    // Pour l'instant, on régénère le fichier (à remplacer par lecture depuis MinIO)
    const data = await this.fetchReportData(report.type as ReportType, report.parameters);
    let buffer: Buffer;

    switch (report.format) {
      case ExportFormat.PDF:
        buffer = await this.generatePDF(report, data);
        break;
      case ExportFormat.EXCEL:
        buffer = await this.generateExcel(report, data);
        break;
      case ExportFormat.CSV:
        buffer = await this.generateCSV(report, data);
        break;
      case ExportFormat.JSON:
        buffer = Buffer.from(JSON.stringify(data, null, 2));
        break;
      default:
        throw new BadRequestException(`Unsupported format: ${report.format}`);
    }

    return {
      buffer,
      filename: report.filename,
      mimeType: report.mimeType || 'application/octet-stream',
    };
  }

  /**
   * Nettoie les rapports expirés
   */
  async cleanupExpiredReports() {
    const now = new Date();

    const expiredReports = await this.prisma.report.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    if (expiredReports.length > 0) {
      await this.prisma.report.deleteMany({
        where: {
          id: { in: expiredReports.map((r) => r.id) },
        },
      });
    }

    return { deleted: expiredReports.length };
  }
}
