import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('leave-types')
@ApiBearerAuth()
@Controller('leave-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer un nouveau type de congé (ADMIN uniquement)' })
  @ApiResponse({ status: 201, description: 'Type de congé créé' })
  @ApiResponse({ status: 409, description: 'Le code existe déjà' })
  create(@Body() createLeaveTypeDto: CreateLeaveTypeDto, @Request() req) {
    return this.leaveTypesService.create(createLeaveTypeDto, req.user.sub);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les types de congés' })
  @ApiResponse({ status: 200, description: 'Liste des types de congés' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.leaveTypesService.findAll(include);
  }

  @Public()
  @Get('total-days')
  @ApiOperation({ summary: 'Calculer le total de jours par défaut' })
  @ApiResponse({ status: 200, description: 'Total calculé' })
  calculateTotalDays() {
    return this.leaveTypesService.calculateTotalDefaultDays();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un type de congé par ID' })
  @ApiResponse({ status: 200, description: 'Type de congé trouvé' })
  @ApiResponse({ status: 404, description: 'Type de congé non trouvé' })
  findOne(@Param('id') id: string) {
    return this.leaveTypesService.findOne(id);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Récupérer un type de congé par code' })
  @ApiResponse({ status: 200, description: 'Type de congé trouvé' })
  @ApiResponse({ status: 404, description: 'Type de congé non trouvé' })
  findByCode(@Param('code') code: string) {
    return this.leaveTypesService.findByCode(code);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mettre à jour un type de congé (ADMIN uniquement)' })
  @ApiResponse({ status: 200, description: 'Type de congé mis à jour' })
  @ApiResponse({ status: 404, description: 'Type de congé non trouvé' })
  update(@Param('id') id: string, @Body() updateLeaveTypeDto: UpdateLeaveTypeDto) {
    return this.leaveTypesService.update(id, updateLeaveTypeDto);
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Désactiver un type de congé (ADMIN uniquement)' })
  @ApiResponse({ status: 200, description: 'Type de congé désactivé' })
  @ApiResponse({ status: 403, description: 'Type système non désactivable' })
  deactivate(@Param('id') id: string) {
    return this.leaveTypesService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Réactiver un type de congé (ADMIN uniquement)' })
  @ApiResponse({ status: 200, description: 'Type de congé réactivé' })
  activate(@Param('id') id: string) {
    return this.leaveTypesService.activate(id);
  }

  @Post('reorder')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Réorganiser l\'ordre des types de congés (ADMIN uniquement)' })
  @ApiResponse({ status: 200, description: 'Ordre mis à jour' })
  reorder(@Body() body: { orderedIds: string[] }) {
    return this.leaveTypesService.reorder(body.orderedIds);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer un type de congé (ADMIN uniquement)' })
  @ApiResponse({ status: 200, description: 'Type de congé supprimé' })
  @ApiResponse({ status: 403, description: 'Type système non supprimable' })
  @ApiResponse({ status: 404, description: 'Type de congé non trouvé' })
  remove(@Param('id') id: string) {
    return this.leaveTypesService.remove(id);
  }
}
