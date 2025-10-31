import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { SkillLevel } from './create-user-skill.dto';

export class UpdateTaskSkillDto {
  @IsEnum(SkillLevel)
  @IsOptional()
  minimumLevel?: SkillLevel;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}
