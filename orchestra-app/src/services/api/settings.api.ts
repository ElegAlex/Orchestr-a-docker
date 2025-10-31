import api from './client';

export interface SystemSettings {
  id: string;
  // Firebase/Database Configuration
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number;
  indexOptimization: boolean;
  // Email Configuration
  emailEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string; // Always masked as ********
  fromEmail: string;
  fromName: string;
  notificationsEnabled: boolean;
  dailyDigest: boolean;
  // System Limits
  maxProjects: number;
  maxUsers: number;
  maxTasksPerProject: number;
  maxFileSize: number;
  maxStoragePerUser: number;
  // Maintenance Mode
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  // Calendar Configuration
  visibleWeekDays: number[];
  // Audit
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  // Firebase/Database Configuration
  autoBackup?: boolean;
  backupFrequency?: 'daily' | 'weekly' | 'monthly';
  backupRetention?: number;
  indexOptimization?: boolean;
  // Email Configuration
  emailEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  notificationsEnabled?: boolean;
  dailyDigest?: boolean;
  // System Limits
  maxProjects?: number;
  maxUsers?: number;
  maxTasksPerProject?: number;
  maxFileSize?: number;
  maxStoragePerUser?: number;
  // Maintenance Mode
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  // Calendar Configuration
  visibleWeekDays?: number[];
}

export interface MaintenanceStatus {
  enabled: boolean;
  message?: string;
}

export interface SystemStats {
  current: {
    projects: number;
    users: number;
    tasks: number;
  };
  limits: {
    maxProjects: number;
    maxUsers: number;
    maxTasksPerProject: number;
    maxFileSize: number;
    maxStoragePerUser: number;
  };
  usage: {
    projectsPercentage: number;
    usersPercentage: number;
  };
}

export interface EmailTestResult {
  success: boolean;
  message: string;
}

export const settingsAPI = {
  /**
   * Récupère la configuration système
   */
  async getSettings(): Promise<SystemSettings> {
    const response = await api.get('/settings');
    return response.data;
  },

  /**
   * Met à jour la configuration système (Admin uniquement)
   */
  async updateSettings(data: UpdateSettingsRequest): Promise<SystemSettings> {
    const response = await api.put('/settings', data);
    return response.data;
  },

  /**
   * Teste la configuration email (Admin uniquement)
   */
  async testEmail(email: string): Promise<EmailTestResult> {
    const response = await api.post('/settings/test-email', null, {
      params: { email },
    });
    return response.data;
  },

  /**
   * Récupère les statistiques système
   */
  async getStats(): Promise<SystemStats> {
    const response = await api.get('/settings/stats');
    return response.data;
  },

  /**
   * Vérifie le statut du mode maintenance
   */
  async checkMaintenance(): Promise<MaintenanceStatus> {
    const response = await api.get('/settings/maintenance');
    return response.data;
  },

  /**
   * Active le mode maintenance (Admin uniquement)
   */
  async enableMaintenance(message?: string): Promise<SystemSettings> {
    return this.updateSettings({
      maintenanceMode: true,
      maintenanceMessage: message || 'Maintenance en cours. Retour prévu dans quelques minutes.',
    });
  },

  /**
   * Désactive le mode maintenance (Admin uniquement)
   */
  async disableMaintenance(): Promise<SystemSettings> {
    return this.updateSettings({
      maintenanceMode: false,
    });
  },

  /**
   * Met à jour uniquement les limites système (Admin uniquement)
   */
  async updateLimits(limits: {
    maxProjects?: number;
    maxUsers?: number;
    maxTasksPerProject?: number;
    maxFileSize?: number;
    maxStoragePerUser?: number;
  }): Promise<SystemSettings> {
    return this.updateSettings(limits);
  },

  /**
   * Met à jour uniquement la configuration email (Admin uniquement)
   */
  async updateEmailConfig(emailConfig: {
    emailEnabled?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromEmail?: string;
    fromName?: string;
    notificationsEnabled?: boolean;
    dailyDigest?: boolean;
  }): Promise<SystemSettings> {
    return this.updateSettings(emailConfig);
  },

  /**
   * Met à jour uniquement la configuration de backup (Admin uniquement)
   */
  async updateBackupConfig(backupConfig: {
    autoBackup?: boolean;
    backupFrequency?: 'daily' | 'weekly' | 'monthly';
    backupRetention?: number;
    indexOptimization?: boolean;
  }): Promise<SystemSettings> {
    return this.updateSettings(backupConfig);
  },
};
