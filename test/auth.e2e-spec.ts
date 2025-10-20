jest.mock('../src/config', () => ({ appConfig: { KEY: 'APP_CONFIG_TOKEN' } }), {
  virtual: true,
});

jest.mock('../src/users/entities/user.entity', () => ({ User: class User {} }), {
  virtual: true,
});

jest.mock('../src/auth/guards/jwt.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {
    canActivate(ctx) {
      const req = ctx.switchToHttp().getRequest();
      req.user = { id: 1 };
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';

const authServiceMock: Partial<Record<keyof AuthService, any>> = {
  register: jest.fn(async (dto) => ({
    message: 'Пользователь успешно зарегистрирован',
    tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
    user: { id: 1, name: dto.name, email: dto.email }
  })),
  login: jest.fn(async (dto) => ({
    message: 'Вход выполнен',
    accessToken: 'mock-access',
    refreshToken: 'mock-refresh',
    user: { id: 1, email: dto.email, name: 'Test User' }
  })),
  logout: jest.fn(async () => ({ message: 'Выход выполнен' })),
  refreshTokens: jest.fn(async () => ({
    message: 'Токены обновлены',
    accessToken: 'new-access',
    refreshToken: 'new-refresh'
  }))
};
describe('E2E /auth (controller + mocked service)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register → 201 созданный пользователь', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'password123', city: 'Moscow' })
      .expect(201);

    expect(res.body).toMatchObject({
      message: 'Пользователь успешно зарегистрирован',
      tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
      user: { id: 1, name: 'Test', email: 'test@example.com' }
    });
    expect(authServiceMock.register).toHaveBeenCalledWith({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
      city: 'Moscow'
    });
  });

  it('POST /auth/login → 200 вход', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    expect(res.body).toMatchObject({
      message: 'Вход выполнен',
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh'
    });
    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('POST /auth/logout → 200 выход', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .expect(200);

    expect(res.body).toEqual({ message: 'Выход выполнен' });
    expect(authServiceMock.logout).toHaveBeenCalled();
  });

  it('POST /auth/refresh → 200 обновленные токены', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .expect(200);

    expect(res.body).toEqual({
      message: 'Токены обновлены',
      accessToken: 'new-access',
      refreshToken: 'new-refresh'
    });
    expect(authServiceMock.refreshTokens).toHaveBeenCalled();
  });
});