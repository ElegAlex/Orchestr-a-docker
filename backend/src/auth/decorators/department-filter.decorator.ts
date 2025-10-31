import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Décorateur pour extraire le filtre département de la requête
 *
 * Usage dans un controller:
 * @Get('/users')
 * async getUsers(@GetDepartmentFilter() departmentFilter: string | null) {
 *   // departmentFilter sera null si ADMIN/RESPONSABLE
 *   // departmentFilter sera le departmentId de l'user sinon
 *   return this.usersService.findAll({ departmentId: departmentFilter });
 * }
 */
export const GetDepartmentFilter = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.departmentFilter ?? null;
  },
);
