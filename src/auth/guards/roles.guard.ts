import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/users.enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

type ReqUser = { roles?: UserRole[] } | undefined;

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;
    const req = context
      .switchToHttp()
      .getRequest<{ user?: ReqUser } & Record<string, unknown>>();
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Пользователь не аутентифицирован');
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        'У вас недостаточно прав для выполнения этого действия',
      );
    }

    return true;
  }
}
