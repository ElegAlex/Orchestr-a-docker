import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectDto } from './dto/filter-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Contrôleur de gestion des projets
 */
@ApiTags('Projets')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('ADMIN', 'RESPONSABLE', 'MANAGER')
  @ApiOperation({ summary: 'Créer un nouveau projet' })
  @ApiResponse({ status: 201, description: 'Projet créé avec succès' })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des projets avec filtres et pagination' })
  @ApiResponse({ status: 200, description: 'Liste des projets' })
  findAll(@Query() filterDto: FilterProjectDto) {
    return this.projectsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({ status: 200, description: 'Détails du projet' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques d\'un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({ status: 200, description: 'Statistiques du projet' })
  getProjectStats(@Param('id') id: string) {
    return this.projectsService.getProjectStats(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'RESPONSABLE', 'MANAGER')
  @ApiOperation({ summary: 'Modifier un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({ status: 200, description: 'Projet modifié avec succès' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'RESPONSABLE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({ status: 200, description: 'Projet supprimé avec succès' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/members')
  @Roles('ADMIN', 'RESPONSABLE', 'MANAGER')
  @ApiOperation({ summary: 'Ajouter un membre au projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({ status: 201, description: 'Membre ajouté avec succès' })
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto) {
    return this.projectsService.addMember(id, addMemberDto);
  }

  @Delete(':projectId/members/:userId')
  @Roles('ADMIN', 'RESPONSABLE', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer un membre du projet' })
  @ApiParam({ name: 'projectId', description: 'ID du projet' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Membre retiré avec succès' })
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeMember(projectId, userId);
  }
}
