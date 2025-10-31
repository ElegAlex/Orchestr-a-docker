import { IsNotEmpty, IsEnum, IsDateString, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

/**
 * DTO pour créer une demande de congé
 */
export class CreateLeaveDto {
  @ApiProperty({
    description: 'Type de congé',
    enum: LeaveType,
    example: 'PAID_LEAVE',
  })
  @IsNotEmpty()
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({
    description: 'Date de début (ISO 8601)',
    example: '2025-12-20',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Date de fin (ISO 8601)',
    example: '2025-12-24',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Nombre de jours de congé (peut être décimal pour demi-journées)',
    example: 5,
    minimum: 0.5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.5)
  days: number;

  @ApiProperty({
    description: 'Motif de la demande (optionnel)',
    example: 'Vacances d\'été en famille',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
