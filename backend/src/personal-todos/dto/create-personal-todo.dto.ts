import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreatePersonalTodoDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  priority?: number; // 1=high, 2=medium, 3=low (default: 3)
}
