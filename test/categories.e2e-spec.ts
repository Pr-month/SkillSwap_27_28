jest.mock(
  'src/users/users.enums',
  () => ({ UserRole: { USER: 'USER', ADMIN: 'ADMIN' } }),
  { virtual: true },
);

jest.mock('../src/auth/guards/jwt.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {
    canActivate(ctx) {
      const req = ctx.switchToHttp().getRequest();
      req.user = { _id: 1, roles: ['ADMIN'] };
      return true;
    }
  },
}));
jest.mock('../src/auth/guards/roles.guard', () => ({
  RolesGuard: class RolesGuard {
    canActivate() {
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { CategoriesController } from '../src/categories/categories.controller';
import { CategoriesService } from '../src/categories/categories.service';

const categoriesServiceMock: Partial<Record<keyof CategoriesService, any>> = {
  findAll: jest.fn(async () => [{ id: 1, name: 'Programming', children: [] }]),
  create: jest.fn(async (dto) => ({
    id: 10,
    name: String(dto.name).trim(),
    parent: null,
  })),
  update: jest.fn(async (id, dto) => ({
    message: 'Категория обновлена',
    id: Number(id),
    dto,
  })),
  remove: jest.fn(async (id) => ({
    message: 'Категория удалена',
    id: Number(id),
  })),
};

describe('E2E /categories (controller + mocked service)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: categoriesServiceMock },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /categories → 200 массив', async () => {
    const res = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(categoriesServiceMock.findAll).toHaveBeenCalled();
  });

  it('POST /categories → 201 созданная категория', async () => {
    const res = await request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Backend' })
      .expect(201);

    expect(res.body).toMatchObject({ id: expect.any(Number), name: 'Backend' });
    expect(categoriesServiceMock.create).toHaveBeenCalledWith({
      name: 'Backend',
    });
  });

  it('PATCH /categories/:id → 200', async () => {
    const res = await request(app.getHttpServer())
      .patch('/categories/7')
      .send({ name: 'NewName' })
      .expect(200);

    expect(res.body).toMatchObject({ message: 'Категория обновлена' });
    expect(categoriesServiceMock.update).toHaveBeenCalledWith('7', {
      name: 'NewName',
    });
  });

  it('DELETE /categories/:id → 200', async () => {
    const res = await request(app.getHttpServer())
      .delete('/categories/5')
      .expect(200);
    expect(res.body).toMatchObject({ message: 'Категория удалена' });
    expect(categoriesServiceMock.remove).toHaveBeenCalledWith('5');
  });
});
