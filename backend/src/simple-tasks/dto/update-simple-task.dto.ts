import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSimpleTaskDto } from './create-simple-task.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum SimpleTaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export class UpdateSimpleTaskDto extends PartialType(
  OmitType(CreateSimpleTaskDto, ['assignedTo', 'createdBy'] as const),
) {
  @IsEnum(SimpleTaskStatus)
  @IsOptional()
  status?: SimpleTaskStatus;
}
