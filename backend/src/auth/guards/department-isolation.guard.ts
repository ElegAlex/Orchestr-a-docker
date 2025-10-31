import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_CROSS_DEPARTMENT_KEY } from '../decorators/allow-cross-department.decorator';

/**
 * Guard pour l'isolation par département
 *
 * RÔLES AVEC ACCÈS CROSS-DÉPARTEMENT:
 * - ADMIN : Accès total à tous les départements
 * - RESPONSABLE : Accès total à tous les départements
 *
 * RÔLES AVEC ISOLATION:
 * - MANAGER : Voit uniquement son département
 * - TEAM_LEAD : Voit uniquement son département
 * - CONTRIBUTOR : Voit uniquement son département
 * - VIEWER : Voit uniquement son département
 *
 * MÉCANISME:
 * Le guard injecte automatiquement `departmentFilter` dans la requête
 * si l'utilisateur n'a pas accès cross-département.
 * Les services peuvent utiliser ce filtre pour limiter les résultats.
 *
 * BYPASS:
 * Les endpoints décorés avec @AllowCrossDepartment() ne sont pas filtrés.
 */
@Injectable()
export class DepartmentIsolationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Vérifier si l'endpoint autorise le cross-département
    const allowCrossDepartment = this.reflector.getAllAndOverride<boolean>(
      ALLOW_CROSS_DEPARTMENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si pas d'utilisateur connecté, laisser passer (sera bloqué par JwtAuthGuard)
    if (!user) {
      return true;
    }

    // Si l'endpoint permet le cross-département, ne pas filtrer
    if (allowCrossDepartment) {
      request.departmentFilter = null;
      return true;
    }

    // ADMIN et RESPONSABLE ont accès à tous les départements
    const canSeeAllDepartments = user.role === 'ADMIN' || user.role === 'RESPONSABLE';

    if (canSeeAllDepartments) {
      // Pas de filtre département pour ces rôles
      request.departmentFilter = null;
    } else {
      // Injecter le filtre département pour isolation
      request.departmentFilter = user.departmentId;
    }

    return true;
  }
}
