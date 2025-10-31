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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeleworkService } from './telework.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateUserTeleworkProfileDto,
  UpdateUserTeleworkProfileDto,
  CreateTeleworkOverrideDto,
  ApproveTeleworkOverrideDto,
  CreateTeamTeleworkRuleDto,
  UpdateTeamTeleworkRuleDto,
  ValidateOverrideRequestDto,
  GetOverridesQueryDto,
} from './telework.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetDepartmentFilter } from '../auth/decorators/department-filter.decorator';

@ApiTags('telework')
@Controller('telework')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeleworkController {
  constructor(private readonly teleworkService: TeleworkService) {}

  // =============================================
  // PROFILES - Gestion des profils utilisateur
  // =============================================

  /**
   * POST /api/telework/profiles - Créer un profil télétravail
   */
  @Post('profiles')
  @ApiOperation({ summary: 'Créer un profil télétravail utilisateur' })
  @ApiResponse({ status: 201, description: 'Profil créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou profil existant' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  createProfile(@Body() dto: CreateUserTeleworkProfileDto) {
    return this.teleworkService.createUserProfile(dto);
  }

  /**
   * GET /api/telework/profiles - Récupérer tous les profils
   * 🔒 Isolation par département : Les utilisateurs non-ADMIN/RESPONSABLE
   * ne voient que les profils de leur département
   */
  @Get('profiles')
  @ApiOperation({ summary: 'Récupérer tous les profils télétravail (admin)' })
  @ApiResponse({ status: 200, description: 'Liste des profils récupérée' })
  getAllProfiles(@GetDepartmentFilter() departmentFilter: string | null) {
    return this.teleworkService.getAllProfiles(departmentFilter);
  }

  /**
   * GET /api/telework/profiles/:userId - Récupérer le profil d'un utilisateur
   */
  @Get('profiles/:userId')
  @ApiOperation({ summary: 'Récupérer le profil télétravail d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Profil non trouvé' })
  getUserProfile(@Param('userId') userId: string) {
    return this.teleworkService.getUserProfile(userId);
  }

  /**
   * PATCH /api/telework/profiles/:userId - Mettre à jour un profil
   */
  @Patch('profiles/:userId')
  @ApiOperation({ summary: 'Mettre à jour un profil télétravail' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Profil non trouvé' })
  updateProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserTeleworkProfileDto,
  ) {
    return this.teleworkService.updateUserProfile(userId, dto);
  }

  /**
   * POST /api/telework/profiles/:userId/get-or-create - Obtenir ou créer un profil
   */
  @Post('profiles/:userId/get-or-create')
  @ApiOperation({
    summary: 'Obtenir un profil ou le créer s\'il n\'existe pas',
  })
  @ApiResponse({ status: 200, description: 'Profil récupéré ou créé' })
  getOrCreateProfile(
    @Param('userId') userId: string,
    @Body() body: { displayName: string; createdBy: string },
  ) {
    return this.teleworkService.getOrCreateUserProfile(
      userId,
      body.displayName,
      body.createdBy,
    );
  }

  // =============================================
  // OVERRIDES - Gestion des exceptions
  // =============================================

  /**
   * POST /api/telework/overrides - Créer une demande d'exception
   * BUG-05 FIX: Utilisateurs ne peuvent créer que leurs propres exceptions
   */
  @Post('overrides')
  @ApiOperation({ summary: 'Créer une demande d\'exception télétravail (pour soi-même ou ADMIN/RESPONSABLE pour tous)' })
  @ApiResponse({ status: 201, description: 'Exception créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou exception existante' })
  @ApiResponse({ status: 403, description: 'Vous ne pouvez créer que vos propres exceptions' })
  async requestOverride(
    @Body() dto: CreateTeleworkOverrideDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    console.log('🔍 [Backend] Received override request:', JSON.stringify(dto, null, 2));
    try {
      const result = await this.teleworkService.requestOverride(dto, currentUserId, currentUserRole);
      console.log('✅ [Backend] Override created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ [Backend] Error creating override:', error.message);
      throw error;
    }
  }

  /**
   * GET /api/telework/overrides - Récupérer les exceptions avec filtres
   */
  @Get('overrides')
  @ApiOperation({ summary: 'Récupérer les exceptions avec filtres optionnels' })
  @ApiResponse({ status: 200, description: 'Liste des exceptions récupérée' })
  getOverrides(@Query() query: GetOverridesQueryDto) {
    return this.teleworkService.getOverrides(query);
  }

  /**
   * GET /api/telework/overrides/pending - Récupérer les exceptions en attente
   */
  @Get('overrides/pending')
  @ApiOperation({ summary: 'Récupérer les exceptions en attente d\'approbation' })
  @ApiResponse({ status: 200, description: 'Liste des exceptions en attente' })
  getPendingOverrides(@Query('approverId') approverId?: string) {
    return this.teleworkService.getPendingOverrides(approverId);
  }

  /**
   * GET /api/telework/overrides/user/:userId - Récupérer les exceptions d'un utilisateur
   */
  @Get('overrides/user/:userId')
  @ApiOperation({ summary: 'Récupérer les exceptions d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des exceptions récupérée' })
  getUserOverrides(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.teleworkService.getUserOverrides(userId, start, end);
  }

  /**
   * PATCH /api/telework/overrides/:id/approve - Approuver une exception
   */
  @Patch('overrides/:id/approve')
  @ApiOperation({ summary: 'Approuver une exception télétravail' })
  @ApiResponse({ status: 200, description: 'Exception approuvée avec succès' })
  @ApiResponse({ status: 400, description: 'Exception déjà traitée' })
  @ApiResponse({ status: 404, description: 'Exception non trouvée' })
  approveOverride(
    @Param('id') id: string,
    @Body() dto: ApproveTeleworkOverrideDto,
  ) {
    return this.teleworkService.approveOverride(id, dto);
  }

  /**
   * PATCH /api/telework/overrides/:id/reject - Rejeter une exception
   */
  @Patch('overrides/:id/reject')
  @ApiOperation({ summary: 'Rejeter une exception télétravail' })
  @ApiResponse({ status: 200, description: 'Exception rejetée avec succès' })
  @ApiResponse({ status: 400, description: 'Exception déjà traitée ou raison manquante' })
  @ApiResponse({ status: 404, description: 'Exception non trouvée' })
  rejectOverride(
    @Param('id') id: string,
    @Body() dto: ApproveTeleworkOverrideDto,
  ) {
    return this.teleworkService.rejectOverride(id, dto);
  }

  /**
   * DELETE /api/telework/overrides/:id - Supprimer une exception
   * BUG-05 FIX: Utilisateurs ne peuvent supprimer que leurs propres exceptions
   */
  @Delete('overrides/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une exception télétravail (seulement la sienne ou ADMIN/RESPONSABLE pour toutes)' })
  @ApiResponse({ status: 200, description: 'Exception supprimée avec succès' })
  @ApiResponse({ status: 403, description: 'Vous ne pouvez supprimer que vos propres exceptions' })
  @ApiResponse({ status: 404, description: 'Exception non trouvée' })
  deleteOverride(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.teleworkService.deleteOverride(id, currentUserId, currentUserRole);
  }

  /**
   * POST /api/telework/overrides/validate - Valider une demande d'exception
   */
  @Post('overrides/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valider une demande d\'exception avant création',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultat de validation retourné',
  })
  validateOverride(@Body() dto: ValidateOverrideRequestDto) {
    return this.teleworkService.validateOverrideRequest(dto);
  }

  /**
   * DELETE /api/telework/overrides/cleanup - Nettoyer les exceptions expirées
   */
  @Delete('overrides/cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer les exceptions expirées' })
  @ApiResponse({
    status: 200,
    description: 'Nettoyage effectué avec succès',
  })
  cleanupExpiredOverrides() {
    return this.teleworkService.cleanupExpiredOverrides();
  }

  // =============================================
  // TEAM RULES - Gestion des règles équipe
  // =============================================

  /**
   * POST /api/telework/team-rules - Créer une règle équipe
   */
  @Post('team-rules')
  @ApiOperation({ summary: 'Créer une règle télétravail pour une équipe' })
  @ApiResponse({ status: 201, description: 'Règle créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  createTeamRule(@Body() dto: CreateTeamTeleworkRuleDto) {
    return this.teleworkService.createTeamRule(dto);
  }

  /**
   * GET /api/telework/team-rules - Récupérer toutes les règles équipe
   */
  @Get('team-rules')
  @ApiOperation({ summary: 'Récupérer toutes les règles équipe' })
  @ApiResponse({ status: 200, description: 'Liste des règles récupérée' })
  getAllTeamRules() {
    return this.teleworkService.getAllTeamRules();
  }

  /**
   * GET /api/telework/team-rules/user/:userId - Récupérer les règles pour un utilisateur
   */
  @Get('team-rules/user/:userId')
  @ApiOperation({
    summary: 'Récupérer les règles équipe actives pour un utilisateur',
  })
  @ApiResponse({ status: 200, description: 'Liste des règles récupérée' })
  getTeamRulesForUser(@Param('userId') userId: string) {
    return this.teleworkService.getTeamRulesForUser(userId);
  }

  /**
   * PATCH /api/telework/team-rules/:id - Mettre à jour une règle équipe
   */
  @Patch('team-rules/:id')
  @ApiOperation({ summary: 'Mettre à jour une règle équipe' })
  @ApiResponse({ status: 200, description: 'Règle mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Règle non trouvée' })
  updateTeamRule(
    @Param('id') id: string,
    @Body() dto: UpdateTeamTeleworkRuleDto,
  ) {
    return this.teleworkService.updateTeamRule(id, dto);
  }

  /**
   * DELETE /api/telework/team-rules/:id - Supprimer une règle équipe
   */
  @Delete('team-rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une règle équipe' })
  @ApiResponse({ status: 200, description: 'Règle supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Règle non trouvée' })
  deleteTeamRule(@Param('id') id: string) {
    return this.teleworkService.deleteTeamRule(id);
  }
}
