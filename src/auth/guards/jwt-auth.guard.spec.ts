import { ExecutionContext } from '@nestjs/common';

jest.mock('@nestjs/passport', () => {
  const mock = (name: string) => {
    return class {
      static strategy = name;
      canActivate = jest.fn().mockReturnValue(true);
    };
  };
  return { AuthGuard: mock };
});

import { JwtAuthGuard } from './jwt-auth.guard';
const ctx: ExecutionContext = {
  switchToHttp: () => ({ getRequest: () => ({}) }) as any,
  getClass: () => ({}) as any,
  getHandler: () => ({}) as any,
} as any;

describe('JwtAuthGuard', () => {
  it('должен создаваться', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });

  it("должен использовать стратегию 'jwt'", () => {
    expect((JwtAuthGuard as any).strategy).toBe('jwt');
  });

  it('canActivate делегирует родителю', () => {
    const guard: any = new JwtAuthGuard();
    const res = guard.canActivate(ctx);
    expect(res).toBe(true);
    expect(guard.canActivate).toBeDefined();
  });
});
