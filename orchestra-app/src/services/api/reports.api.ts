/**
 * API Client pour le Service Reports & Exports
 *
 * Service de génération et gestion des rapports avec export multi-formats
 */

import { apiClient } from './client';

// ========================================
// Types et Enums
// ========================================

export enum ReportType {
  PROJECT_SUMMARY = 'PROJECT_SUMMARY',
  TASK_ANALYSIS = 'TASK_ANALYSIS',
  RESOURCE_UTILIZATION = 'RESOURCE_UTILIZATION',
  LEAVE_SUMMARY = 'LEAVE_SUMMARY',
  SKILL_MATRIX = 'SKILL_MATRIX',
  CUSTOM = 'CUSTOM',
}

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ReportTemplate {
  STANDARD = 'STANDARD',
  EXECUTIVE = 'EXECUTIVE',
  DETAILED = 'DETAILED',
  CUSTOM = 'CUSTOM',
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  parameters: Record<string, any>;
  template?: ReportTemplate;
  status: ReportStatus;
  format: ExportFormat;
  filename?: string;
  filepath?: string;
  filesize?: number;
  mimeType?: string;
  generatedBy: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  startDate?: string;
  endDate?: string;
  summary?: Record<string, any>;
  sections?: Record<string, any>;
  errors?: Record<string, any>;
  isPublic: boolean;
  sharedWith: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
}

export interface CreateReportRequest {
  name: string;
  type: ReportType;
  description?: string;
  parameters: Record<string, any>;
  template?: ReportTemplate;
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
  sharedWith?: string[];
  expiresAt?: string;
}

export interface UpdateReportRequest {
  name?: string;
  description?: string;
  parameters?: Record<string, any>;
  template?: ReportTemplate;
  status?: ReportStatus;
  isPublic?: boolean;
  sharedWith?: string[];
  expiresAt?: string;
}

export interface GetReportsParams {
  type?: ReportType;
  status?: ReportStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CleanupResult {
  deleted: number;
}

// ========================================
// API Client
// ========================================

export const reportsAPI = {
  /**
   * POST /api/reports
   * Crée un nouveau rapport et lance sa génération
   */
  async create(data: CreateReportRequest): Promise<Report> {
    const response = await apiClient.post<Report>('/reports', data);
    return response.data;
  },

  /**
   * GET /api/reports
   * Récupère tous les rapports (avec filtres optionnels)
   */
  async getAll(params?: GetReportsParams): Promise<Report[]> {
    const queryParams = new URLSearchParams();

    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const url = queryParams.toString()
      ? `/reports?${queryParams.toString()}`
      : '/reports';

    const response = await apiClient.get<Report[]>(url);
    return response.data;
  },

  /**
   * GET /api/reports/me
   * Récupère les rapports de l'utilisateur connecté
   */
  async getMine(): Promise<Report[]> {
    const response = await apiClient.get<Report[]>('/reports/me');
    return response.data;
  },

  /**
   * GET /api/reports/:id
   * Récupère un rapport par ID
   */
  async getById(id: string): Promise<Report> {
    const response = await apiClient.get<Report>(`/reports/${id}`);
    return response.data;
  },

  /**
   * PATCH /api/reports/:id
   * Met à jour un rapport
   */
  async update(id: string, data: UpdateReportRequest): Promise<Report> {
    const response = await apiClient.patch<Report>(`/reports/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /api/reports/:id
   * Supprime un rapport
   */
  async delete(id: string): Promise<Report> {
    const response = await apiClient.delete<Report>(`/reports/${id}`);
    return response.data;
  },

  /**
   * POST /api/reports/:id/generate
   * Régénère un rapport
   */
  async regenerate(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/reports/${id}/generate`);
    return response.data;
  },

  /**
   * GET /api/reports/:id/download
   * Télécharge un rapport généré
   * Retourne un Blob pour téléchargement direct
   */
  async download(id: string): Promise<Blob> {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Télécharge un rapport et déclenche le téléchargement dans le navigateur
   */
  async downloadAndSave(id: string, filename?: string): Promise<void> {
    const blob = await this.download(id);

    // Si pas de filename fourni, récupérer le rapport pour obtenir le filename
    if (!filename) {
      const report = await this.getById(id);
      filename = report.filename || `report-${id}.${this.getExtension(report.format)}`;
    }

    // Créer un lien temporaire pour télécharger le fichier
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * DELETE /api/reports/cleanup/expired
   * Nettoie les rapports expirés
   */
  async cleanupExpired(): Promise<CleanupResult> {
    const response = await apiClient.delete<CleanupResult>('/reports/cleanup/expired');
    return response.data;
  },

  // ========================================
  // Méthodes utilitaires
  // ========================================

  /**
   * Obtient l'extension de fichier selon le format
   */
  getExtension(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF:
        return 'pdf';
      case ExportFormat.EXCEL:
        return 'xlsx';
      case ExportFormat.CSV:
        return 'csv';
      case ExportFormat.JSON:
        return 'json';
      default:
        return 'bin';
    }
  },

  /**
   * Obtient le type MIME selon le format
   */
  getMimeType(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF:
        return 'application/pdf';
      case ExportFormat.EXCEL:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case ExportFormat.CSV:
        return 'text/csv';
      case ExportFormat.JSON:
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  },

  /**
   * Formate la taille de fichier en format lisible
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * Vérifie si un rapport est prêt pour téléchargement
   */
  isDownloadable(report: Report): boolean {
    return report.status === ReportStatus.COMPLETED && !!report.filename;
  },

  /**
   * Vérifie si un rapport a échoué
   */
  isFailed(report: Report): boolean {
    return report.status === ReportStatus.FAILED;
  },

  /**
   * Vérifie si un rapport est en cours de génération
   */
  isGenerating(report: Report): boolean {
    return report.status === ReportStatus.GENERATING || report.status === ReportStatus.PENDING;
  },
};
