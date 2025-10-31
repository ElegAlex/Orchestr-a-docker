import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Décorateur @CurrentUser() pour récupérer l'utilisateur connecté
 *
 * Utilisation :
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 *
 * Équivalent à :
 * async getProfile(@Request() req: any) {
 *   return req.user;
 * }
 *
 * Mais plus propre et lisible.
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si un champ spécifique est demandé : @CurrentUser('id')
    return data ? user?.[data] : user;
  },
);
