import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/users.enums';

const reflectorMock = {
  getAllAndOverride: jest.fn(),
} as unknown as Reflector;

const makeCtx = (user?: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as any;

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new RolesGuard(reflectorMock);
  });

  it('возвращает true, если роли не требуются', () => {
    (reflectorMock.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(makeCtx())).toBe(true);
  });

  it('кидает Unauthorized, если роли требуются, а user отсутствует', () => {
    (reflectorMock.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMIN,
    ]);
    expect(() => guard.canActivate(makeCtx(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('кидает Forbidden, если у пользователя нет нужной роли', () => {
    (reflectorMock.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMIN,
    ]);
    const user = { roles: [UserRole.USER] };
    expect(() => guard.canActivate(makeCtx(user))).toThrow(ForbiddenException);
  });

  it('возвращает true, если у пользователя есть требуемая роль', () => {
    (reflectorMock.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMIN,
    ]);
    const user = { roles: [UserRole.ADMIN, UserRole.USER] };
    expect(guard.canActivate(makeCtx(user))).toBe(true);
  });
});
