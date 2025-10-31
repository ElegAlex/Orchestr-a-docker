import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard JWT pour protéger les routes
 *
 * Utilisation :
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * async protectedRoute() { ... }
 *
 * Ce guard :
 * - Vérifie la présence du token JWT
 * - Valide le token via la JwtStrategy
 * - Injecte l'utilisateur dans request.user
 * - Permet les routes publiques marquées avec @Public()
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Détermine si la route nécessite l'authentification
   *
   * Si la route est marquée @Public(), on skip l'authentification
   */
  canActivate(context: ExecutionContext) {
    // Vérifier si la route est publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Skip l'authentification
    }

    // Sinon, appeler le guard JWT standard
    return super.canActivate(context);
  }
}
