import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { SkillLevel } from './create-user-skill.dto';

export class CreateTaskSkillDto {
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @IsEnum(SkillLevel)
  minimumLevel: SkillLevel;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}
