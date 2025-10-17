import { PartialType } from '@nestjs/mapped-types';
import { CreateTeleworkOverrideDto } from './create-telework-override.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateTeleworkOverrideDto extends PartialType(
  CreateTeleworkOverrideDto,
) {
  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;
}

export class UpdateApprovalStatusDto {
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;
}
