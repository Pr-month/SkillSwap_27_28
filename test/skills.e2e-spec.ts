jest.mock('src/config', () => ({ appConfig: { KEY: 'APP_CONFIG_TOKEN' } }), {
  virtual: true,
});
jest.mock('src/users/entities/user.entity', () => ({ User: class User {} }), {
  virtual: true,
});
jest.mock('../src/auth/guards/jwt.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {
    canActivate(ctx) {
      const req = ctx.switchToHttp().getRequest();
      req.user = { _id: 1 };
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { SkillsController } from '../src/skills/skills.controller';
import { SkillsService } from '../src/skills/skills.service';

const skillsServiceMock: Partial<Record<keyof SkillsService, any>> = {
  findAll: jest.fn(async (dto) => ({
    data: [{ id: 1, title: 'NestJS' }],
    page: dto?.page ?? 1,
    totalPages: 1,
  })),
  create: jest.fn(async (dto, ownerId) => ({ id: 10, ownerId, ...dto })),
  update: jest.fn(async (id, dto, ownerId) => ({
    id: Number(id),
    ownerId,
    ...dto,
  })),
  remove: jest.fn(async (id) => ({ message: `Навык ${id} удален` })),
  addToFavorites: jest.fn(async (id, userId) => ({
    message: `Навык ${id} добавлен в избранное пользователем ${userId}`,
  })),
  removeFromFavorites: jest.fn(async (id, userId) => ({
    message: `Навык ${id} удален из избранного пользователем ${userId}`,
  })),
  getFavorites: jest.fn(async (userId) => [
    { id: 1, title: 'NestJS', ownerId: userId },
  ]),
};

describe('E2E /skills (controller + mocked service)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [{ provide: SkillsService, useValue: skillsServiceMock }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /skills → 200 список', async () => {
    const res = await request(app.getHttpServer()).get('/skills').expect(200);
    expect(res.body).toMatchObject({
      data: expect.any(Array),
      page: 1,
      totalPages: 1,
    });
    expect(skillsServiceMock.findAll).toHaveBeenCalled();
  });

  it('POST /skills → 201 созданный', async () => {
    const res = await request(app.getHttpServer())
      .post('/skills')
      .send({ title: 'GraphQL', description: 'desc' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      title: 'GraphQL',
    });
    expect(skillsServiceMock.create).toHaveBeenCalledWith(
      { title: 'GraphQL', description: 'desc' },
      1,
    );
  });

  it('PATCH /skills/:id → 200 обновлённый', async () => {
    const res = await request(app.getHttpServer())
      .patch('/skills/7')
      .send({ title: 'Updated' })
      .expect(200);

    expect(res.body).toMatchObject({ id: 7, title: 'Updated' });
    expect(skillsServiceMock.update).toHaveBeenCalledWith(
      '7',
      { title: 'Updated' },
      1,
    );
  });

  it('DELETE /skills/:id → 200 сообщение', async () => {
    const res = await request(app.getHttpServer())
      .delete('/skills/5')
      .expect(200);
    expect(res.body).toEqual({ message: 'Навык 5 удален' });
    expect(skillsServiceMock.remove).toHaveBeenCalledWith('5', 1);
  });

  it('POST /skills/:id/favorite → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/skills/3/favorite')
      .expect(201);
    expect(res.body.message).toMatch(/добавлен в избранное/i);
    expect(skillsServiceMock.addToFavorites).toHaveBeenCalledWith('3', 1);
  });

  it('DELETE /skills/:id/favorite → 200', async () => {
    const res = await request(app.getHttpServer())
      .delete('/skills/3/favorite')
      .expect(200);
    expect(res.body.message).toMatch(/удален из избранного/i);
    expect(skillsServiceMock.removeFromFavorites).toHaveBeenCalledWith('3', 1);
  });

  it('GET /skills/favorites/my → 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/skills/favorites/my')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(skillsServiceMock.getFavorites).toHaveBeenCalledWith(1);
  });
});
