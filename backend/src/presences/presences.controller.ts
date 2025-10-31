import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PresencesService } from './presences.service';
import { CreateTeleworkOverrideDto } from './dto/create-telework-override.dto';
import {
  UpdateTeleworkOverrideDto,
  UpdateApprovalStatusDto,
} from './dto/update-telework-override.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('presences')
@UseGuards(JwtAuthGuard)
export class PresencesController {
  constructor(private readonly presencesService: PresencesService) {}

  // ==========================================
  // TELEWORK OVERRIDES
  // ==========================================

  /**
   * POST /api/presences/telework-overrides - Créer un telework override
   */
  @Post('telework-overrides')
  createTeleworkOverride(@Body() dto: CreateTeleworkOverrideDto) {
    return this.presencesService.createTeleworkOverride(dto);
  }

  /**
   * GET /api/presences/telework-overrides/user/:userId - Récupérer par utilisateur
   */
  @Get('telework-overrides/user/:userId')
  findTeleworkOverridesByUser(@Param('userId') userId: string) {
    return this.presencesService.findTeleworkOverridesByUser(userId);
  }

  /**
   * GET /api/presences/telework-overrides/date/:date - Récupérer par date
   */
  @Get('telework-overrides/date/:date')
  findTeleworkOverridesForDate(@Param('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.presencesService.findTeleworkOverridesForDate(date);
  }

  /**
   * GET /api/presences/telework-overrides/:id - Récupérer un override par ID
   */
  @Get('telework-overrides/:id')
  findOneTeleworkOverride(@Param('id') id: string) {
    return this.presencesService.findOneTeleworkOverride(id);
  }

  /**
   * PATCH /api/presences/telework-overrides/:id - Mettre à jour un override
   */
  @Patch('telework-overrides/:id')
  updateTeleworkOverride(
    @Param('id') id: string,
    @Body() dto: UpdateTeleworkOverrideDto,
  ) {
    return this.presencesService.updateTeleworkOverride(id, dto);
  }

  /**
   * PATCH /api/presences/telework-overrides/:id/status - Approuver/rejeter
   */
  @Patch('telework-overrides/:id/status')
  updateApprovalStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApprovalStatusDto,
  ) {
    return this.presencesService.updateApprovalStatus(id, dto.status);
  }

  /**
   * DELETE /api/presences/telework-overrides/:id - Supprimer un override
   */
  @Delete('telework-overrides/:id')
  removeTeleworkOverride(@Param('id') id: string) {
    return this.presencesService.removeTeleworkOverride(id);
  }

  // ==========================================
  // PRESENCE CALCULATION
  // ==========================================

  /**
   * GET /api/presences/date/:date - Calculer les présences pour une date
   * Query params: departmentId (optionnel)
   */
  @Get('date/:date')
  getPresencesForDate(
    @Param('date') dateStr: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const date = new Date(dateStr);
    return this.presencesService.getPresencesForDate(date, departmentId);
  }

  /**
   * GET /api/presences/stats/date/:date - Statistiques de présence
   * Query params: departmentId (optionnel)
   */
  @Get('stats/date/:date')
  getPresenceStats(
    @Param('date') dateStr: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const date = new Date(dateStr);
    return this.presencesService.getPresenceStats(date, departmentId);
  }
}
