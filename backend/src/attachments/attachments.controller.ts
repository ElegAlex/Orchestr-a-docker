import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { Response } from 'express';

@ApiTags('Attachments')
@ApiBearerAuth()
@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload une pièce jointe' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        taskId: { type: 'string', nullable: true },
        projectId: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        tags: { type: 'array', items: { type: 'string' }, nullable: true },
        isPublic: { type: 'boolean', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fichier uploadé avec succès' })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou trop volumineux' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAttachmentDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.attachmentsService.uploadFile(file, dto, userId);
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload plusieurs pièces jointes' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        taskId: { type: 'string', nullable: true },
        projectId: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fichiers uploadés avec succès' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 fichiers
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('taskId') taskId: string,
    @Body('projectId') projectId: string,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.attachmentsService.uploadMultipleFiles(files, taskId, projectId, userId);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Récupérer toutes les pièces jointes d\'une tâche' })
  @ApiResponse({ status: 200, description: 'Liste des pièces jointes' })
  async getTaskAttachments(@Param('taskId') taskId: string) {
    return this.attachmentsService.getTaskAttachments(taskId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Récupérer toutes les pièces jointes d\'un projet' })
  @ApiResponse({ status: 200, description: 'Liste des pièces jointes' })
  async getProjectAttachments(@Param('projectId') projectId: string) {
    return this.attachmentsService.getProjectAttachments(projectId);
  }

  @Get('stats/task/:taskId')
  @ApiOperation({ summary: 'Obtenir les statistiques des pièces jointes d\'une tâche' })
  @ApiResponse({ status: 200, description: 'Statistiques des pièces jointes' })
  async getTaskAttachmentStats(@Param('taskId') taskId: string) {
    return this.attachmentsService.getTaskAttachmentStats(taskId);
  }

  @Get('stats/global')
  @ApiOperation({ summary: 'Obtenir les statistiques globales des pièces jointes' })
  @ApiResponse({ status: 200, description: 'Statistiques globales' })
  async getGlobalStats() {
    return this.attachmentsService.getGlobalStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une pièce jointe par ID' })
  @ApiResponse({ status: 200, description: 'Pièce jointe trouvée' })
  @ApiResponse({ status: 404, description: 'Pièce jointe non trouvée' })
  async getAttachment(@Param('id') id: string) {
    return this.attachmentsService.getAttachment(id);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Générer une URL de téléchargement signée (valide 7 jours)' })
  @ApiResponse({ status: 200, description: 'URL de téléchargement générée' })
  async getDownloadUrl(@Param('id') id: string) {
    const url = await this.attachmentsService.getDownloadUrl(id);
    return { url };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Télécharger directement le fichier' })
  @ApiResponse({ status: 200, description: 'Fichier téléchargé' })
  async downloadFile(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { stream, filename, mimeType } = await this.attachmentsService.downloadFile(id);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });

    return new StreamableFile(stream);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour les métadonnées d\'une pièce jointe' })
  @ApiResponse({ status: 200, description: 'Pièce jointe mise à jour' })
  @ApiResponse({ status: 404, description: 'Pièce jointe non trouvée' })
  async updateAttachment(@Param('id') id: string, @Body() dto: UpdateAttachmentDto) {
    return this.attachmentsService.updateAttachment(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une pièce jointe' })
  @ApiResponse({ status: 200, description: 'Pièce jointe supprimée' })
  @ApiResponse({ status: 404, description: 'Pièce jointe non trouvée' })
  async deleteAttachment(@Param('id') id: string) {
    return this.attachmentsService.deleteAttachment(id);
  }
}
