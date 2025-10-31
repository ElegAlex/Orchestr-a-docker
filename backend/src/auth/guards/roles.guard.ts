import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard pour vérifier les rôles utilisateur
 *
 * Utilisation :
 * @Roles('ADMIN', 'MANAGER')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete(':id')
 * async delete() { ... }
 *
 * Ce guard :
 * - Récupère les rôles requis via le décorateur @Roles()
 * - Vérifie que l'utilisateur connecté a l'un des rôles requis
 * - Autorise ou refuse l'accès
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupérer les rôles requis depuis le décorateur @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si pas de rôles requis, autoriser
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Récupérer l'utilisateur depuis request.user (injecté par JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Vérifier si l'utilisateur a l'un des rôles requis
    return requiredRoles.some((role) => user.role === role);
  }
}
