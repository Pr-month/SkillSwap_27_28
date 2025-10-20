import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

jest.mock('@nestjs/passport', () => {
  const mock = (name: string) => {
    return class {
      static strategy = name;
      canActivate = jest.fn().mockReturnValue(true);
    };
  };
  return { AuthGuard: mock };
});

import { RefreshTokenGuard } from './refreshToken.guard';

const ctx: ExecutionContext = {
  switchToHttp: () => ({ getRequest: () => ({}) }) as any,
  getClass: () => ({}) as any,
  getHandler: () => ({}) as any,
} as any;

describe('RefreshTokenGuard', () => {
  it('должен создаваться', () => {
    const guard = new RefreshTokenGuard();
    expect(guard).toBeDefined();
  });

  it("использует стратегию 'refresh-jwt'", () => {
    expect((RefreshTokenGuard as any).strategy).toBe('refresh-jwt');
  });

  it('canActivate делегирует родителю', () => {
    const guard: any = new RefreshTokenGuard();
    const res = guard.canActivate(ctx);
    expect(res).toBe(true);
  });

  it('handleRequest: возвращает user при валидном токене', () => {
    const guard = new RefreshTokenGuard() as any;
    const user = { id: 1 };
    expect(guard.handleRequest(null, user)).toEqual(user);
  });

  it('handleRequest: кидает Unauthorized, если user отсутствует', () => {
    const guard = new RefreshTokenGuard() as any;
    expect(() => guard.handleRequest(null, undefined)).toThrow(
      new UnauthorizedException('Invalid refresh token'),
    );
  });

  it('handleRequest: пробрасывает ошибку, если err задан', () => {
    const guard = new RefreshTokenGuard() as any;
    const err = new Error('boom');
    expect(() => guard.handleRequest(err, null)).toThrow(err);
  });
});
