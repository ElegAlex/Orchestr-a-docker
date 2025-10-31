import { IsBoolean, IsInt, IsOptional, IsString, Min, IsIn, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  // Firebase/Database Configuration
  @ApiProperty({ description: 'Activer les sauvegardes automatiques', required: false })
  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;

  @ApiProperty({ description: 'Fréquence des sauvegardes', enum: ['daily', 'weekly', 'monthly'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'monthly'])
  backupFrequency?: string;

  @ApiProperty({ description: 'Nombre de jours de rétention des sauvegardes', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  backupRetention?: number;

  @ApiProperty({ description: 'Optimisation automatique des index', required: false })
  @IsOptional()
  @IsBoolean()
  indexOptimization?: boolean;

  // Email Configuration
  @ApiProperty({ description: 'Activer l\'envoi d\'emails', required: false })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiProperty({ description: 'Serveur SMTP', required: false })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiProperty({ description: 'Port SMTP', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  smtpPort?: number;

  @ApiProperty({ description: 'Utilisateur SMTP', required: false })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiProperty({ description: 'Mot de passe SMTP', required: false })
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @ApiProperty({ description: 'Email expéditeur', required: false })
  @IsOptional()
  @IsString()
  fromEmail?: string;

  @ApiProperty({ description: 'Nom expéditeur', required: false })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiProperty({ description: 'Activer les notifications email', required: false })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiProperty({ description: 'Activer le digest quotidien', required: false })
  @IsOptional()
  @IsBoolean()
  dailyDigest?: boolean;

  // System Limits
  @ApiProperty({ description: 'Nombre maximum de projets', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxProjects?: number;

  @ApiProperty({ description: 'Nombre maximum d\'utilisateurs', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @ApiProperty({ description: 'Nombre maximum de tâches par projet', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTasksPerProject?: number;

  @ApiProperty({ description: 'Taille maximale des fichiers en MB', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxFileSize?: number;

  @ApiProperty({ description: 'Espace de stockage maximum par utilisateur en MB', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStoragePerUser?: number;

  // Maintenance Mode
  @ApiProperty({ description: 'Activer le mode maintenance', required: false })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiProperty({ description: 'Message affiché en mode maintenance', required: false })
  @IsOptional()
  @IsString()
  maintenanceMessage?: string;

  // Calendar Configuration
  @ApiProperty({ description: 'Jours de la semaine visibles (0=Dimanche, 1=Lundi, ..., 6=Samedi)', required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  visibleWeekDays?: number[];
}
