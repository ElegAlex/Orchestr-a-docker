import { IsString, IsUrl, IsArray, IsOptional, IsObject, IsBoolean, MaxLength } from 'class-validator';
import { WebhookEvent } from '@prisma/client';

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsArray()
  events?: WebhookEvent[];

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
