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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('holidays')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @ApiOperation({ summary: 'Créer un nouveau jour férié' })
  @ApiResponse({ status: 201, description: 'Jour férié créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes (ADMIN/RESPONSABLE requis)' })
  create(@Body() createDto: CreateHolidayDto) {
    return this.holidaysService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les jours fériés' })
  @ApiQuery({ name: 'year', required: false, description: 'Filtrer par année' })
  @ApiQuery({ name: 'isNational', required: false, description: 'Filtrer par jours nationaux' })
  @ApiQuery({ name: 'region', required: false, description: 'Filtrer par région' })
  @ApiResponse({ status: 200, description: 'Liste des jours fériés' })
  findAll(
    @Query('year') year?: string,
    @Query('isNational') isNational?: string,
    @Query('region') region?: string,
  ) {
    return this.holidaysService.findAll({
      year: year ? parseInt(year, 10) : undefined,
      isNational: isNational !== undefined ? isNational === 'true' : undefined,
      region,
    });
  }

  @Get('year/:year')
  @ApiOperation({ summary: 'Récupérer les jours fériés pour une année' })
  @ApiResponse({ status: 200, description: 'Jours fériés de l\'année' })
  findByYear(@Param('year') year: string) {
    return this.holidaysService.findByYear(parseInt(year, 10));
  }

  @Get('year/:year/stats')
  @ApiOperation({ summary: 'Statistiques des jours fériés pour une année' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  getStats(@Param('year') year: string) {
    return this.holidaysService.getStats(parseInt(year, 10));
  }

  @Get('year/:year/easter')
  @ApiOperation({ summary: 'Calculer la date de Pâques pour une année' })
  @ApiResponse({ status: 200, description: 'Date de Pâques' })
  getEasterDate(@Param('year') year: string) {
    const easterDate = this.holidaysService.calculateEasterDate(parseInt(year, 10));
    return {
      year: parseInt(year, 10),
      date: easterDate.toISOString(),
      day: easterDate.getDate(),
      month: easterDate.getMonth() + 1,
    };
  }

  @Get('period')
  @ApiOperation({ summary: 'Récupérer les jours fériés pour une période' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Date de début (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Date de fin (ISO 8601)' })
  @ApiQuery({ name: 'region', required: false, description: 'Région' })
  @ApiResponse({ status: 200, description: 'Jours fériés de la période' })
  findByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('region') region?: string,
  ) {
    return this.holidaysService.findByPeriod(
      new Date(startDate),
      new Date(endDate),
      region,
    );
  }

  @Get('check')
  @ApiOperation({ summary: 'Vérifier si une date est un jour férié' })
  @ApiQuery({ name: 'date', required: true, description: 'Date à vérifier (ISO 8601)' })
  @ApiQuery({ name: 'region', required: false, description: 'Région' })
  @ApiResponse({ status: 200, description: 'Boolean indiquant si c\'est un jour férié' })
  async checkIsHoliday(
    @Query('date') date: string,
    @Query('region') region?: string,
  ) {
    const isHoliday = await this.holidaysService.isHoliday(new Date(date), region);
    const holiday = isHoliday
      ? await this.holidaysService.getHolidayForDate(new Date(date), region)
      : null;

    return {
      date,
      region,
      isHoliday,
      holiday,
    };
  }

  @Get('working-days')
  @ApiOperation({ summary: 'Calculer le nombre de jours ouvrés entre deux dates' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Date de début (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Date de fin (ISO 8601)' })
  @ApiQuery({ name: 'region', required: false, description: 'Région' })
  @ApiResponse({ status: 200, description: 'Nombre de jours ouvrés' })
  async getWorkingDays(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('region') region?: string,
  ) {
    const count = await this.holidaysService.getWorkingDaysBetween(
      new Date(startDate),
      new Date(endDate),
      region,
    );

    return {
      startDate,
      endDate,
      region,
      workingDays: count,
    };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Récupérer les prochains jours fériés' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre max de résultats (défaut: 5)' })
  @ApiResponse({ status: 200, description: 'Prochains jours fériés' })
  getUpcoming(@Query('limit') limit?: string) {
    return this.holidaysService.getUpcoming(limit ? parseInt(limit, 10) : 5);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un jour férié par ID' })
  @ApiResponse({ status: 200, description: 'Jour férié trouvé' })
  @ApiResponse({ status: 404, description: 'Jour férié non trouvé' })
  findOne(@Param('id') id: string) {
    return this.holidaysService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @ApiOperation({ summary: 'Mettre à jour un jour férié' })
  @ApiResponse({ status: 200, description: 'Jour férié mis à jour' })
  @ApiResponse({ status: 404, description: 'Jour férié non trouvé' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes (ADMIN/RESPONSABLE requis)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateHolidayDto) {
    return this.holidaysService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @ApiOperation({ summary: 'Supprimer un jour férié (BUG-01 FIX: Permissions ajoutées)' })
  @ApiResponse({ status: 200, description: 'Jour férié supprimé' })
  @ApiResponse({ status: 404, description: 'Jour férié non trouvé' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes (ADMIN/RESPONSABLE requis)' })
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
