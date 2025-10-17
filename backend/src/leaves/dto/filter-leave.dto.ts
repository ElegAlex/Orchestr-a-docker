import { IsOptional, IsEnum, IsUUID, IsDateString, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType, LeaveStatus } from '@prisma/client';

/**
 * DTO pour filtrer et paginer les demandes de congé
 */
export class FilterLeaveDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Type de congé',
    enum: LeaveType,
    required: false,
  })
  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @ApiProperty({
    description: 'Statut de la demande',
    enum: LeaveStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiProperty({
    description: 'Date de début minimum (ISO 8601)',
    example: '2025-12-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiProperty({
    description: 'Date de début maximum (ISO 8601)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiProperty({
    description: 'Recherche dans le motif',
    example: 'vacances',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Numéro de page',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    example: 20,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    description: 'Champ de tri',
    example: 'startDate',
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Ordre de tri',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
