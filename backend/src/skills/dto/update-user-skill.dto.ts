import { IsEnum, IsInt, IsOptional, IsArray, IsString, IsDateString } from 'class-validator';
import { SkillLevel } from './create-user-skill.dto';

export class UpdateUserSkillDto {
  @IsEnum(SkillLevel)
  @IsOptional()
  level?: SkillLevel;

  @IsInt()
  @IsOptional()
  yearsOfExperience?: number;

  @IsDateString()
  @IsOptional()
  lastUsedAt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
