import { PartialType } from '@nestjs/mapped-types';
import { CreateEpicDto, EpicStatus } from './create-epic.dto';
import { IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateEpicDto extends PartialType(CreateEpicDto) {
  // Hérite tous les champs de CreateEpicDto en optionnel
}

export class UpdateEpicProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;
}

export class UpdateEpicStatusDto {
  @IsEnum(EpicStatus)
  status: EpicStatus;
}
