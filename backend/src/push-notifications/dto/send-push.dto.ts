import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, IsBoolean } from 'class-validator';

export class SendPushDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  requireInteraction?: boolean;

  @IsBoolean()
  @IsOptional()
  silent?: boolean;

  @IsArray()
  @IsOptional()
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}
