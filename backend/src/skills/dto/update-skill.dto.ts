import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { SkillCategory } from './create-skill.dto';

export class UpdateSkillDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SkillCategory)
  @IsOptional()
  category?: SkillCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
