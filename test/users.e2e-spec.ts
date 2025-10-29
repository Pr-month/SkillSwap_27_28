jest.mock(
  '../src/users/users.enums',
  () => ({ UserRole: { USER: 'USER', ADMIN: 'ADMIN' } }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/entities/user.entity';

import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

const usersServiceMock: Partial<Record<keyof UsersService, any>> = {
  findAll: jest.fn(async ({ page = 1, limit = 10 } = {}) => ({
    data: [
      {
        id: 1,
        email: 'ivan@example.com',
        firstName: 'Иван',
        lastName: 'Иванов',
        roles: ['ADMIN'],
      } as unknown as User,
    ],
    meta: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  })),
  findById: jest.fn(async (id: number) => ({
    id,
    email: 'ivan@example.com',
    firstName: 'Иван',
    lastName: 'Иванов',
  })),
  update: jest.fn(async (id: number, dto: any) => ({
    id,
    email: 'ivan@example.com',
    firstName: dto.firstName ?? 'Иван',
    lastName: dto.lastName ?? 'Иванов',
  })),
  updatePassword: jest.fn(async (_id: number, _dto: any) => undefined),
  remove: jest.fn(async (id: number) => ({ message: 'Удалён', id })),
  findBySkill: jest.fn(async (_skillId: number) => [
    { id: 2, email: 'vika@example.com' },
  ]),
};

describe('UsersController (mocked service)', () => {
  let app: INestApplication;

  const TOKEN = 'test-token';
  const withAuth = (t: request.Test) =>
    t.set('Authorization', `Bearer ${TOKEN}`);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(ctx) {
          const req = ctx.switchToHttp().getRequest();
          req.user = { _id: 1, userId: 1, roles: ['ADMIN'] };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users → 200, возвращает пагинированный список', async () => {
    const res = await withAuth(
      request(app.getHttpServer()).get('/users?page=2&limit=5'),
    ).expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toMatchObject({ currentPage: 2, itemsPerPage: 5 });
    expect(usersServiceMock.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
    });
  });

  it('GET /users/me → 200, возвращает текущего пользователя', async () => {
    const res = await withAuth(
      request(app.getHttpServer()).get('/users/me'),
    ).expect(200);

    expect(res.body).toMatchObject({ id: 1, email: 'ivan@example.com' });
    expect(usersServiceMock.findById).toHaveBeenCalledWith(1);
  });

  it('PATCH /users/me → 200, обновляет профиль', async () => {
    const dto = { firstName: 'New', lastName: 'Name' };

    const res = await withAuth(
      request(app.getHttpServer()).patch('/users/me').send(dto),
    ).expect(200);

    expect(res.body).toMatchObject({ id: 1, ...dto });
    expect(usersServiceMock.update).toHaveBeenCalledWith(1, dto);
  });

  it('PATCH /users/me/password → 200, меняет пароль', async () => {
    const dto = { currentPassword: 'old', newPassword: 'new' };

    const res = await withAuth(
      request(app.getHttpServer()).patch('/users/me/password').send(dto),
    ).expect(200);

    expect(res.body).toMatchObject({
      message: 'Пароль успешно обновлен',
      statusCode: 200,
    });
    expect(usersServiceMock.updatePassword).toHaveBeenCalledWith(1, dto);
  });

  it('DELETE /users/:id → 200, удаляет пользователя (admin)', async () => {
    const res = await withAuth(
      request(app.getHttpServer()).delete('/users/5'),
    ).expect(200);

    expect(res.body).toMatchObject({ message: 'Удалён', id: 5 });
    expect(usersServiceMock.remove).toHaveBeenCalledWith(5);
  });

  it('GET /users/by-skill/:id → 200, список пользователей по навыку', async () => {
    const res = await withAuth(
      request(app.getHttpServer()).get('/users/by-skill/3'),
    ).expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ id: 2, email: 'vika@example.com' });
    expect(usersServiceMock.findBySkill).toHaveBeenCalledWith(3);
  });
});
