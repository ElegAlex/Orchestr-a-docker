import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Rénovation Hôtel de Ville',
    description: 'Nom du projet',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  name: string;

  @ApiProperty({
    example: 'Projet de rénovation complète de l\'Hôtel de Ville avec mise aux normes énergétiques',
    description: 'Description du projet',
    required: false,
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Statut du projet',
    enum: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED'],
    required: false,
    default: 'DRAFT',
  })
  @IsEnum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED'], {
    message: 'Statut invalide',
  })
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 'HIGH',
    description: 'Priorité du projet',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: false,
    default: 'MEDIUM',
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Priorité invalide',
  })
  @IsOptional()
  priority?: string;

  @ApiProperty({
    example: 250000.50,
    description: 'Budget du projet',
    required: false,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Le budget doit être un nombre' })
  @Min(0, { message: 'Le budget doit être positif' })
  @IsOptional()
  budget?: number;

  @ApiProperty({
    example: '2025-11-01T00:00:00.000Z',
    description: 'Date de début du projet',
  })
  @IsDateString({}, { message: 'Date de début invalide' })
  @IsNotEmpty({ message: 'La date de début est requise' })
  startDate: string;

  @ApiProperty({
    example: '2026-06-30T23:59:59.999Z',
    description: 'Date de fin prévue du projet',
  })
  @IsDateString({}, { message: 'Date de fin invalide' })
  @IsNotEmpty({ message: 'La date de fin est requise' })
  dueDate: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID du chef de projet',
  })
  @IsUUID('4', { message: 'ID de chef de projet invalide' })
  @IsNotEmpty({ message: 'Le chef de projet est requis' })
  managerId: string;

  @ApiProperty({
    example: ['travaux', 'renovation', 'energie'],
    description: 'Tags du projet',
    required: false,
    type: [String],
  })
  @IsArray({ message: 'Les tags doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque tag doit être une chaîne de caractères' })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: { phase: 'etude', subvention: 'DETR' },
    description: 'Métadonnées flexibles (JSON)',
    required: false,
  })
  @IsOptional()
  metadata?: any;
}
