import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto, ReportType } from './dto/create-report.dto';
import { UpdateReportDto, ReportStatus } from './dto/update-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * POST /api/reports
   * Crée un nouveau rapport et lance sa génération
   */
  @Post()
  async create(@Body() createReportDto: CreateReportDto, @Req() req: any) {
    return this.reportsService.create(createReportDto, req.user.id);
  }

  /**
   * GET /api/reports
   * Récupère tous les rapports (avec filtres optionnels)
   */
  @Get()
  async findAll(
    @Query('type') type?: ReportType,
    @Query('status') status?: ReportStatus,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.findAll({
      type,
      status,
      userId,
      startDate,
      endDate,
    });
  }

  /**
   * GET /api/reports/me
   * Récupère les rapports de l'utilisateur connecté
   */
  @Get('me')
  async findMy(@Req() req: any) {
    return this.reportsService.findByUser(req.user.id);
  }

  /**
   * GET /api/reports/:id
   * Récupère un rapport par ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  /**
   * PATCH /api/reports/:id
   * Met à jour un rapport
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(id, updateReportDto);
  }

  /**
   * DELETE /api/reports/:id
   * Supprime un rapport
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }

  /**
   * POST /api/reports/:id/generate
   * Régénère un rapport
   */
  @Post(':id/generate')
  async regenerate(@Param('id') id: string) {
    await this.reportsService.generateReport(id);
    return { message: 'Report generation started' };
  }

  /**
   * GET /api/reports/:id/download
   * Télécharge un rapport généré
   */
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename, mimeType } = await this.reportsService.downloadReport(id);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  /**
   * DELETE /api/reports/cleanup/expired
   * Nettoie les rapports expirés
   */
  @Delete('cleanup/expired')
  async cleanupExpired() {
    return this.reportsService.cleanupExpiredReports();
  }
}
