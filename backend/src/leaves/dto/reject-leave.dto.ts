import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour rejeter une demande de congé
 */
export class RejectLeaveDto {
  @ApiProperty({
    description: 'Raison du rejet (optionnel)',
    example: 'Période de forte activité, merci de décaler votre demande',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
