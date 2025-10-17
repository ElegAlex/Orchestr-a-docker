import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/**
 * DTO pour mettre à jour un projet
 *
 * Hérite de CreateProjectDto avec tous les champs optionnels
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
