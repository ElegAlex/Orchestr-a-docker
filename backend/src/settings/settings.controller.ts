import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer la configuration système' })
  @ApiResponse({ status: 200, description: 'Configuration système' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour la configuration système (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Configuration mise à jour' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit - Admin requis' })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  updateSettings(@Body() updateDto: UpdateSettingsDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.settingsService.updateSettings(updateDto, userId);
  }

  @Post('test-email')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tester la configuration email (Admin uniquement)' })
  @ApiQuery({ name: 'email', description: 'Email de test', required: true })
  @ApiResponse({ status: 200, description: 'Résultat du test' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit - Admin requis' })
  testEmail(@Query('email') email: string) {
    return this.settingsService.testEmailConfiguration(email);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @ApiOperation({ summary: 'Obtenir les statistiques système' })
  @ApiResponse({ status: 200, description: 'Statistiques système' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  getStats() {
    return this.settingsService.getSystemStats();
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Vérifier le statut du mode maintenance' })
  @ApiResponse({ status: 200, description: 'Statut mode maintenance' })
  checkMaintenance() {
    return this.settingsService.checkMaintenanceMode();
  }
}
