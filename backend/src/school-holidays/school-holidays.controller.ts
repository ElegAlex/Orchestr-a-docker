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
import { SchoolHolidaysService } from './school-holidays.service';
import { CreateSchoolHolidayDto } from './dto/create-school-holiday.dto';
import { UpdateSchoolHolidayDto } from './dto/update-school-holiday.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SchoolHolidayZone } from '@prisma/client';

@ApiTags('school-holidays')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('school-holidays')
export class SchoolHolidaysController {
  constructor(private readonly schoolHolidaysService: SchoolHolidaysService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau congé scolaire' })
  @ApiResponse({ status: 201, description: 'Congé scolaire créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  create(@Body() createDto: CreateSchoolHolidayDto) {
    return this.schoolHolidaysService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les congés scolaires' })
  @ApiQuery({ name: 'year', required: false, description: 'Filtrer par année scolaire' })
  @ApiQuery({ name: 'zone', required: false, enum: SchoolHolidayZone, description: 'Filtrer par zone' })
  @ApiQuery({ name: 'period', required: false, description: 'Filtrer par période' })
  @ApiResponse({ status: 200, description: 'Liste des congés scolaires' })
  findAll(
    @Query('year') year?: string,
    @Query('zone') zone?: SchoolHolidayZone,
    @Query('period') period?: string,
  ) {
    return this.schoolHolidaysService.findAll({
      year: year ? parseInt(year, 10) : undefined,
      zone,
      period,
    });
  }

  @Get('year/:year')
  @ApiOperation({ summary: 'Récupérer les congés scolaires pour une année' })
  @ApiResponse({ status: 200, description: 'Congés scolaires de l\'année' })
  findByYear(@Param('year') year: string) {
    return this.schoolHolidaysService.findByYear(parseInt(year, 10));
  }

  @Get('year/:year/stats')
  @ApiOperation({ summary: 'Statistiques des congés scolaires pour une année' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  getStats(@Param('year') year: string) {
    return this.schoolHolidaysService.getStats(parseInt(year, 10));
  }

  @Get('period')
  @ApiOperation({ summary: 'Récupérer les congés scolaires pour une période' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Date de début (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Date de fin (ISO 8601)' })
  @ApiQuery({ name: 'zone', required: false, enum: SchoolHolidayZone })
  @ApiResponse({ status: 200, description: 'Congés scolaires de la période' })
  findByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('zone') zone?: SchoolHolidayZone,
  ) {
    return this.schoolHolidaysService.findByPeriod(
      new Date(startDate),
      new Date(endDate),
      zone,
    );
  }

  @Get('check')
  @ApiOperation({ summary: 'Vérifier si une date est un congé scolaire' })
  @ApiQuery({ name: 'date', required: true, description: 'Date à vérifier (ISO 8601)' })
  @ApiQuery({ name: 'zone', required: false, enum: SchoolHolidayZone })
  @ApiResponse({ status: 200, description: 'Boolean indiquant si c\'est un congé' })
  async checkIsSchoolHoliday(
    @Query('date') date: string,
    @Query('zone') zone?: SchoolHolidayZone,
  ) {
    const isHoliday = await this.schoolHolidaysService.isSchoolHoliday(
      new Date(date),
      zone,
    );
    return { date, zone, isSchoolHoliday: isHoliday };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un congé scolaire par ID' })
  @ApiResponse({ status: 200, description: 'Congé scolaire trouvé' })
  @ApiResponse({ status: 404, description: 'Congé scolaire non trouvé' })
  findOne(@Param('id') id: string) {
    return this.schoolHolidaysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un congé scolaire' })
  @ApiResponse({ status: 200, description: 'Congé scolaire mis à jour' })
  @ApiResponse({ status: 404, description: 'Congé scolaire non trouvé' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSchoolHolidayDto) {
    return this.schoolHolidaysService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un congé scolaire' })
  @ApiResponse({ status: 200, description: 'Congé scolaire supprimé' })
  @ApiResponse({ status: 404, description: 'Congé scolaire non trouvé' })
  remove(@Param('id') id: string) {
    return this.schoolHolidaysService.remove(id);
  }
}
