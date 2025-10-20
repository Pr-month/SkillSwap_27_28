import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Gender, UserRole } from '../src/users/users.enums';

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    // Очищаем базу перед каждым тестом
    await userRepository.delete({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          city: 'Moscow',
          about: 'Test about me',
          birthdate: '1990-01-01',
          gender: Gender.MALE
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('message', 'Пользователь успешно зарегистрирован');
          expect(response.body).toHaveProperty('tokens');
          expect(response.body.tokens).toHaveProperty('accessToken');
          expect(response.body.tokens).toHaveProperty('refreshToken');
          expect(response.body.user).toEqual({
            id: expect.any(Number),
            name: 'Test User',
            email: 'test@example.com',
            about: 'Test about me',
            birthdate: '1990-01-01T00:00:00.000Z',
            city: 'Moscow',
            gender: Gender.MALE,
            avatar: null,
            role: UserRole.USER,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          });
          // Проверяем, что пароль не возвращается
          expect(response.body.user).not.toHaveProperty('password');
          expect(response.body.user).not.toHaveProperty('refreshToken');
        });
    });

    it('should not register user with existing email', async () => {
      // Сначала создаем пользователя
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'password123',
          city: 'Moscow'
        });

      // Пытаемся создать с тем же email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          password: 'password123',
          city: 'Moscow'
        })
        .expect(409)
        .then((response) => {
          expect(response.body.message).toContain('Пользователь с таким email уже существует');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short'
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('email must be an email');
          expect(response.body.message).toContain('password must be longer than or equal to 8 characters');
          expect(response.body.message).toContain('name must be longer than or equal to 2 characters');
        });
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Создаем пользователя для тестов логина
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Login Test User',
          email: 'login@example.com',
          password: 'password123',
          city: 'Moscow'
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('message', 'Вход выполнен');
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');
          expect(response.body.user.email).toBe('login@example.com');
          expect(response.body.user).not.toHaveProperty('password');
        });
    });

    it('should not login with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401)
        .then((response) => {
          expect(response.body.message).toContain('Неверный email или пароль');
        });
    });

    it('should not login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401)
        .then((response) => {
          expect(response.body.message).toContain('Неверный email или пароль');
        });
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;
    let userId: number;

    beforeEach(async () => {
      // Регистрируем пользователя и получаем токен
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Logout Test User',
          email: 'logout@example.com',
          password: 'password123',
          city: 'Moscow'
        });

      accessToken = registerResponse.body.tokens.accessToken;
      userId = registerResponse.body.user.id;
    });

    it('should logout successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('message', 'Выход выполнен');
        });
    });

    it('should not logout without token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      // Регистрируем пользователя
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Refresh Test User',
          email: 'refresh@example.com',
          password: 'password123',
          city: 'Moscow'
        });

      refreshToken = registerResponse.body.tokens.refreshToken;
      accessToken = registerResponse.body.tokens.accessToken;
    });

    it('should refresh tokens with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('message', 'Токены обновлены');
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');
          // Новые токены должны отличаться от старых
          expect(response.body.accessToken).not.toBe(accessToken);
          expect(response.body.refreshToken).not.toBe(refreshToken);
        });
    });

    it('should not refresh tokens without refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);
    });

    it('should not refresh tokens with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-refresh-token')
        .expect(401);
    });
  });

  describe('Protected Routes Access', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Регистрируем пользователя
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Protected Test User',
          email: 'protected@example.com',
          password: 'password123',
          city: 'Moscow'
        });

      accessToken = registerResponse.body.tokens.accessToken;
    });

    it('should access protected route with valid token', () => {
      // Тестируем на примере логаута (требует авторизацию)
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should not access protected route without token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should not access protected route with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});