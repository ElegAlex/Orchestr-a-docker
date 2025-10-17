import { IsString, IsBoolean, IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdatePersonalTodoDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  priority?: number;
}
