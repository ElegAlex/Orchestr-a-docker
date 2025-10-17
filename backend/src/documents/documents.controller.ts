import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Res,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Contrôleur de gestion des documents
 *
 * Toutes les routes nécessitent une authentification JWT
 * Upload/Download de fichiers via MinIO
 */
@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Upload un document
   * Accessible à tous les utilisateurs authentifiés
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload un document',
    description:
      'Upload un fichier vers MinIO et enregistre les métadonnées en base',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
          example: 'Plan architecture.pdf',
        },
        projectId: {
          type: 'string',
          example: 'b387b5f3-6c78-440f-b500-f17776a177af',
        },
        taskId: {
          type: 'string',
          example: 'cd0024ea-1cca-46e4-8547-8e5ca87636a2',
        },
        isPublic: {
          type: 'boolean',
          example: false,
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['important', 'architecture'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploadé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Fichier manquant ou invalide',
  })
  @ApiResponse({
    status: 404,
    description: 'Projet ou tâche non trouvé',
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    return this.documentsService.uploadDocument(
      uploadDto,
      file,
      req.user.id,
    );
  }

  /**
   * Récupérer tous les documents avec filtrage et pagination
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les documents',
    description:
      'Liste tous les documents avec possibilité de filtrage et pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des documents récupérée avec succès',
  })
  findAll(@Query() filterDto: FilterDocumentDto) {
    return this.documentsService.findAll(filterDto);
  }

  /**
   * Récupérer les statistiques des documents d'un projet
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get('project/:projectId/stats')
  @ApiOperation({
    summary: 'Statistiques des documents d\'un projet',
    description:
      'Récupère les statistiques par type, taille, et visibilité pour un projet',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID du projet',
    example: 'b387b5f3-6c78-440f-b500-f17776a177af',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Projet non trouvé',
  })
  getProjectDocumentStats(@Param('projectId') projectId: string) {
    return this.documentsService.getProjectDocumentStats(projectId);
  }

  /**
   * Récupérer un document par ID (métadonnées uniquement)
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un document',
    description: 'Récupère les métadonnées d\'un document par son ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du document',
    example: 'uuid-du-document',
  })
  @ApiResponse({
    status: 200,
    description: 'Document récupéré avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Document non trouvé',
  })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  /**
   * Télécharger un fichier
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id/download')
  @ApiOperation({
    summary: 'Télécharger un fichier',
    description: 'Télécharge le fichier depuis MinIO',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du document',
    example: 'uuid-du-document',
  })
  @ApiResponse({
    status: 200,
    description: 'Fichier téléchargé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Document non trouvé',
  })
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename, mimetype } =
      await this.documentsService.downloadFile(id);

    res.set({
      'Content-Type': mimetype,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  /**
   * Générer une URL de téléchargement temporaire (24h)
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id/download-url')
  @ApiOperation({
    summary: 'Générer une URL de téléchargement temporaire',
    description: 'Génère une URL pré-signée valide 24h pour télécharger le fichier',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du document',
    example: 'uuid-du-document',
  })
  @ApiResponse({
    status: 200,
    description: 'URL générée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Document non trouvé',
  })
  getDownloadUrl(@Param('id') id: string) {
    return this.documentsService.getDownloadUrl(id);
  }

  /**
   * Mettre à jour les métadonnées d'un document
   * Accessible à l'uploader ou aux ADMIN/RESPONSABLE/MANAGER
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.RESPONSABLE, Role.MANAGER)
  @ApiOperation({
    summary: 'Mettre à jour un document',
    description:
      'Met à jour les métadonnées d\'un document. Réservé aux gestionnaires.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du document',
    example: 'uuid-du-document',
  })
  @ApiResponse({
    status: 200,
    description: 'Document mis à jour avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Document non trouvé',
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.update(id, updateDto, req.user.id);
  }

  /**
   * Supprimer un document (fichier + métadonnées)
   * Rôles autorisés : ADMIN, RESPONSABLE, MANAGER
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.RESPONSABLE, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un document',
    description:
      'Supprime un document (fichier MinIO + métadonnées). Réservé aux gestionnaires.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du document',
    example: 'uuid-du-document',
  })
  @ApiResponse({
    status: 200,
    description: 'Document supprimé avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : rôle insuffisant',
  })
  @ApiResponse({
    status: 404,
    description: 'Document non trouvé',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.documentsService.remove(id, req.user.id);
  }
}
