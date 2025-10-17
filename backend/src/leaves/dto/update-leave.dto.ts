import { IsOptional, IsEnum, IsDateString, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

/**
 * DTO pour modifier une demande de congé
 * Note: Seules les demandes avec status PENDING peuvent être modifiées
 */
export class UpdateLeaveDto {
  @ApiProperty({
    description: 'Type de congé',
    enum: LeaveType,
    example: 'PAID_LEAVE',
    required: false,
  })
  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @ApiProperty({
    description: 'Date de début (ISO 8601)',
    example: '2025-12-20',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Date de fin (ISO 8601)',
    example: '2025-12-24',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Nombre de jours de congé',
    example: 5,
    minimum: 0.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  days?: number;

  @ApiProperty({
    description: 'Motif de la demande',
    example: 'Vacances d\'été en famille',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
