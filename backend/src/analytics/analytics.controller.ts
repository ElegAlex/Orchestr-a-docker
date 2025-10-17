import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { AnalyticsPeriod } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==========================================
  // KPIs GLOBAUX
  // ==========================================

  @Get('kpis')
  async getGlobalKPIs(@Query() filters: AnalyticsFilterDto) {
    const dateFilters = {
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      projects: filters.projects,
      users: filters.users,
    };

    return this.analyticsService.getGlobalKPIs(dateFilters);
  }

  // ==========================================
  // MÉTRIQUES PROJET
  // ==========================================

  @Get('projects/:projectId')
  async getProjectMetrics(
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getProjectMetrics(projectId, dateRange);
  }

  // ==========================================
  // MÉTRIQUES RESSOURCE
  // ==========================================

  @Get('resources/:userId')
  async getResourceMetrics(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getResourceMetrics(userId, dateRange);
  }

  @Get('resources/me/metrics')
  async getMyResourceMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getResourceMetrics(req.user.id, dateRange);
  }

  // ==========================================
  // RAPPORTS EXÉCUTIFS
  // ==========================================

  @Post('reports')
  async generateExecutiveReport(
    @Request() req,
    @Body() generateReportDto: GenerateReportDto,
  ) {
    return this.analyticsService.generateExecutiveReport(
      generateReportDto.period,
      req.user.id,
    );
  }

  @Get('reports')
  async getReports(
    @Request() req,
    @Query('period') period?: AnalyticsPeriod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.analyticsService.getReports(req.user.id, filters);
  }

  @Get('reports/:id')
  async getReportById(@Param('id') id: string) {
    return this.analyticsService.getReportById(id);
  }

  // ==========================================
  // CACHE
  // ==========================================

  @Get('cache/:key')
  async getCachedMetrics(@Param('key') key: string) {
    return this.analyticsService.getCachedMetrics(key);
  }

  @Delete('cache')
  async clearCache(@Query('type') type?: string) {
    await this.analyticsService.clearCache(type as any);
    return { message: 'Cache cleared successfully' };
  }

  @Delete('cache/expired')
  async cleanExpiredCache() {
    await this.analyticsService.cleanExpiredCache();
    return { message: 'Expired cache cleaned successfully' };
  }

  // ==========================================
  // HR ANALYTICS
  // ==========================================

  @Get('hr/metrics')
  async getHRMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('label') label?: string,
  ) {
    return this.analyticsService.getHRMetrics({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      label,
    });
  }

  @Get('hr/leave-patterns')
  async analyzeLeavePatterns(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.analyzeLeavePatterns({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  }

  @Get('hr/team-capacity-forecast')
  async forecastTeamCapacity(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('label') label?: string,
  ) {
    return this.analyticsService.forecastTeamCapacity({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      label,
    });
  }
}
