jest.mock('src/config', () => ({ appConfig: { KEY: 'APP_CONFIG_TOKEN' } }), {
  virtual: true,
});
jest.mock(
  'src/config/jwt.config',
  () => ({ jwtConfig: { KEY: 'JWT_CONFIG_TOKEN' } }),
  { virtual: true },
);
jest.mock(
  'src/config/app.config',
  () => ({ appConfig: { KEY: 'APP_CONFIG_TOKEN' } }),
  { virtual: true },
);

jest.mock('src/users/entities/user.entity', () => ({ User: class User {} }), {
  virtual: true,
});
jest.mock(
  'src/skills/entities/skill.entity',
  () => ({ Skill: class Skill {} }),
  { virtual: true },
);
jest.mock(
  'src/categories/entities/category.entity',
  () => ({ Category: class Category {} }),
  { virtual: true },
);
jest.mock(
  'src/requests/entities/request.entity',
  () => ({ Request: class Request {} }),
  { virtual: true },
);

jest.mock(
  'src/users/users.enums',
  () => ({ UserRole: { USER: 'USER', ADMIN: 'ADMIN' } }),
  { virtual: true },
);

jest.mock('../src/users/entities/user.entity', () => ({ User: class User {} }));
jest.mock('../src/skills/entities/skill.entity', () => ({
  Skill: class Skill {},
}));
jest.mock('../src/categories/entities/category.entity', () => ({
  Category: class Category {},
}));
jest.mock('../src/requests/entities/request.entity', () => ({
  Request: class Request {},
}));

jest.mock(
  'src/auth/strategies/jwt.strategy',
  () => ({ JwtStrategy: class JwtStrategy {} }),
  { virtual: true },
);
jest.mock(
  'src/auth/strategies/refreshToken.strategy',
  () => ({ RefreshTokenStrategy: class RefreshTokenStrategy {} }),
  { virtual: true },
);
jest.mock('../src/auth/strategies/jwt.strategy', () => ({
  JwtStrategy: class JwtStrategy {},
}));
jest.mock('../src/auth/strategies/refreshToken.strategy', () => ({
  RefreshTokenStrategy: class RefreshTokenStrategy {},
}));

jest.mock(
  'src/notifications/notifications.gateway',
  () => ({
    NotificationsGateway: class NotificationsGateway {
      handleConnection() {}
      handleDisconnect() {}
    },
  }),
  { virtual: true },
);
jest.mock(
  'src/notifications/guards/ws-jwt.guard',
  () => ({
    WsJwtGuard: class WsJwtGuard {
      canActivate() {
        return true;
      }
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/auth/guards/jwt-auth.guard',
  () => ({
    JwtAuthGuard: class JwtAuthGuard {
      canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        req.user = { _id: 1, roles: ['ADMIN'] };
        return true;
      }
    },
  }),
  { virtual: true },
);
jest.mock(
  'src/auth/decorators/roles.decorator',
  () => ({ Roles: () => () => {} }),
  { virtual: true },
);
jest.mock(
  'src/auth/guards/roles.guard',
  () => ({
    RolesGuard: class RolesGuard {
      canActivate() {
        return true;
      }
    },
  }),
  { virtual: true },
);

jest.mock('@nestjs/typeorm', () => {
  const actual = jest.requireActual('@nestjs/typeorm');

  const DummyDynamicModule = {
    module: class MockTypeOrmModule {},
    providers: [],
    exports: [],
  };
  const InjectRepository = () => () => {};

  return {
    ...actual,
    TypeOrmModule: {
      forRoot: () => DummyDynamicModule,
      forRootAsync: () => DummyDynamicModule,
      forFeature: () => DummyDynamicModule,
    },
    InjectRepository,
    getRepositoryToken: actual.getRepositoryToken,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Request as RequestEntity } from '../src/requests/entities/request.entity';

import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { SkillsService } from '../src/skills/skills.service';
import { CategoriesService } from '../src/categories/categories.service';
import { RequestsService } from '../src/requests/requests.service';
import { NotificationsGateway } from '../src/notifications/notifications.gateway';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('JWT_CONFIG_TOKEN')
      .useValue({
        secret: 'test-secret',
        accessTokenTtl: '15m',
        refreshTokenTtl: '7d',
      })
      .overrideProvider('APP_CONFIG_TOKEN')
      .useValue({
        bcryptSaltRounds: 10,
      })
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        find: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn().mockResolvedValue([[], 0]),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(Skill))
      .useValue({
        find: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn().mockResolvedValue([[], 0]),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(Category))
      .useValue({
        find: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn().mockResolvedValue([[], 0]),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(RequestEntity))
      .useValue({
        find: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn().mockResolvedValue([[], 0]),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })
      .overrideProvider(AuthService)
      .useValue({
        login: jest.fn(),
        register: jest.fn(),
        refresh: jest.fn(),
      })
      .overrideProvider(UsersService)
      .useValue({
        findAll: jest.fn(),
        findById: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        updatePassword: jest.fn(),
        findBySkill: jest.fn(),
      })
      .overrideProvider(SkillsService)
      .useValue({
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        addToFavorites: jest.fn(),
        removeFromFavorites: jest.fn(),
        getFavorites: jest.fn(),
      })
      .overrideProvider(CategoriesService)
      .useValue({
        findAll: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
      })
      .overrideProvider(RequestsService)
      .useValue({
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        accept: jest.fn(),
        decline: jest.fn(),
      })
      .overrideProvider(NotificationsGateway)
      .useValue({
        handleConnection() {},
        handleDisconnect() {},
        notify: jest.fn(),
        server: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
