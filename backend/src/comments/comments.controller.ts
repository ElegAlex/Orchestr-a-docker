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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FilterCommentDto } from './dto/filter-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Contrôleur de gestion des commentaires
 *
 * Toutes les routes nécessitent une authentification JWT
 * Modification/suppression réservées à l'auteur ou ADMIN
 */
@ApiTags('comments')
@ApiBearerAuth()
@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Créer un nouveau commentaire
   * Accessible à tous les utilisateurs authentifiés
   */
  @Post()
  @ApiOperation({
    summary: 'Créer un commentaire',
    description: 'Crée un nouveau commentaire sur une tâche',
  })
  @ApiResponse({
    status: 201,
    description: 'Commentaire créé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.create(createCommentDto, req.user.id);
  }

  /**
   * Récupérer tous les commentaires avec filtrage et pagination
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les commentaires',
    description:
      'Liste tous les commentaires avec possibilité de filtrage et pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des commentaires récupérée avec succès',
  })
  findAll(@Query() filterDto: FilterCommentDto) {
    return this.commentsService.findAll(filterDto);
  }

  /**
   * Récupérer un commentaire par ID
   * Accessible à tous les utilisateurs authentifiés
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un commentaire',
    description: 'Récupère les détails d\'un commentaire par son ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du commentaire',
    example: 'uuid-du-commentaire',
  })
  @ApiResponse({
    status: 200,
    description: 'Commentaire récupéré avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Commentaire non trouvé',
  })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  /**
   * Mettre à jour un commentaire
   * Réservé à l'auteur ou ADMIN
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un commentaire',
    description:
      'Met à jour le contenu d\'un commentaire. Réservé à l\'auteur ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du commentaire',
    example: 'uuid-du-commentaire',
  })
  @ApiResponse({
    status: 200,
    description: 'Commentaire mis à jour avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : vous n\'êtes pas l\'auteur',
  })
  @ApiResponse({
    status: 404,
    description: 'Commentaire non trouvé',
  })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.update(
      id,
      updateCommentDto,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Supprimer un commentaire
   * Réservé à l'auteur ou ADMIN
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un commentaire',
    description: 'Supprime un commentaire. Réservé à l\'auteur ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du commentaire',
    example: 'uuid-du-commentaire',
  })
  @ApiResponse({
    status: 200,
    description: 'Commentaire supprimé avec succès',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé : vous n\'êtes pas l\'auteur',
  })
  @ApiResponse({
    status: 404,
    description: 'Commentaire non trouvé',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.commentsService.remove(id, req.user.id, req.user.role);
  }
}
