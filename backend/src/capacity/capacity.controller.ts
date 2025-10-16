import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CapacityService, DatePeriod, UserCapacity } from './capacity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';

@Controller('capacity')
@UseGuards(JwtAuthGuard)
export class CapacityController {
  constructor(private readonly capacityService: CapacityService) {}

  // ==========================================
  // CONTRACTS
  // ==========================================

  /**
   * GET /capacity/contracts/:userId
   * Récupère le contrat actif d'un utilisateur
   */
  @Get('contracts/:userId')
  async getUserContract(@Param('userId') userId: string) {
    return this.capacityService.getUserContract(userId);
  }

  /**
   * GET /capacity/contracts/:userId/all
   * Récupère tous les contrats d'un utilisateur
   */
  @Get('contracts/:userId/all')
  async getUserContracts(@Param('userId') userId: string) {
    return this.capacityService.getUserContracts(userId);
  }

  /**
   * GET /capacity/contracts/me/current
   * Récupère mon contrat actif
   */
  @Get('contracts/me/current')
  async getMyContract(@Request() req) {
    return this.capacityService.getUserContract(req.user.id);
  }

  /**
   * POST /capacity/contracts/:userId
   * Crée un contrat pour un utilisateur
   */
  @Post('contracts/:userId')
  async createContract(
    @Param('userId') userId: string,
    @Body() dto: CreateContractDto
  ) {
    return this.capacityService.createContract(userId, dto);
  }

  /**
   * PUT /capacity/contracts/:contractId
   * Met à jour un contrat
   */
  @Put('contracts/:contractId')
  async updateContract(
    @Param('contractId') contractId: string,
    @Body() dto: UpdateContractDto
  ) {
    return this.capacityService.updateContract(contractId, dto);
  }

  /**
   * DELETE /capacity/contracts/:contractId
   * Supprime un contrat
   */
  @Delete('contracts/:contractId')
  async deleteContract(@Param('contractId') contractId: string) {
    return this.capacityService.deleteContract(contractId);
  }

  // ==========================================
  // ALLOCATIONS
  // ==========================================

  /**
   * GET /capacity/allocations/user/:userId
   * Récupère les allocations d'un utilisateur
   */
  @Get('allocations/user/:userId')
  async getUserAllocations(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.capacityService.getUserAllocations(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  /**
   * GET /capacity/allocations/project/:projectId
   * Récupère les allocations d'un projet
   */
  @Get('allocations/project/:projectId')
  async getProjectAllocations(
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.capacityService.getProjectAllocations(
      projectId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  /**
   * GET /capacity/allocations/me
   * Récupère mes allocations
   */
  @Get('allocations/me')
  async getMyAllocations(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.capacityService.getUserAllocations(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  /**
   * POST /capacity/allocations
   * Crée une allocation de ressource
   */
  @Post('allocations')
  async createAllocation(@Body() dto: CreateAllocationDto) {
    return this.capacityService.createAllocation(dto);
  }

  /**
   * PUT /capacity/allocations/:allocationId
   * Met à jour une allocation
   */
  @Put('allocations/:allocationId')
  async updateAllocation(
    @Param('allocationId') allocationId: string,
    @Body() dto: UpdateAllocationDto
  ) {
    return this.capacityService.updateAllocation(allocationId, dto);
  }

  /**
   * DELETE /capacity/allocations/:allocationId
   * Supprime une allocation
   */
  @Delete('allocations/:allocationId')
  async deleteAllocation(@Param('allocationId') allocationId: string) {
    return this.capacityService.deleteAllocation(allocationId);
  }

  // ==========================================
  // CALCUL DE CAPACITÉ
  // ==========================================

  /**
   * GET /capacity/calculate/:userId
   * Calcule la capacité d'un utilisateur pour une période
   */
  @Get('calculate/:userId')
  async calculateUserCapacity(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('label') label?: string
  ): Promise<UserCapacity> {
    if (!startDate || !endDate) {
      throw new Error('startDate et endDate sont requis');
    }

    return this.capacityService.calculateUserCapacity(
      userId,
      new Date(startDate),
      new Date(endDate),
      label
    );
  }

  /**
   * GET /capacity/calculate/me/current
   * Calcule ma capacité pour une période
   */
  @Get('calculate/me/current')
  async calculateMyCapacity(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('label') label?: string
  ): Promise<UserCapacity> {
    if (!startDate || !endDate) {
      throw new Error('startDate et endDate sont requis');
    }

    return this.capacityService.calculateUserCapacity(
      req.user.id,
      new Date(startDate),
      new Date(endDate),
      label
    );
  }

  /**
   * GET /capacity/cached/:userId
   * Récupère la capacité en cache
   */
  @Get('cached/:userId')
  async getCachedCapacity(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new Error('startDate et endDate sont requis');
    }

    return this.capacityService.getCachedCapacity(
      userId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  /**
   * GET /capacity/periods
   * Génère des périodes prédéfinies
   */
  @Get('periods')
  async generatePeriods(
    @Query('type') type: 'month' | 'quarter' | 'year',
    @Query('year') year: string
  ): Promise<DatePeriod[]> {
    if (!type || !year) {
      throw new Error('type et year sont requis');
    }

    return this.capacityService.generatePeriods(type, parseInt(year, 10));
  }
}
