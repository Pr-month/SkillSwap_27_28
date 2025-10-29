const APP_CONFIG_TOKEN = 'APP_CONFIG_TOKEN';

jest.mock(
  'src/config',
  () => ({
    appConfig: { KEY: APP_CONFIG_TOKEN },
  }),
  { virtual: true },
);

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

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import * as bcryptjs from 'bcrypt';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { UserRole } from './users.enums';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const userRepoToken = getRepositoryToken(User);
const skillRepoToken = getRepositoryToken(Skill);

const makeRepo = <T extends ObjectLiteral>() =>
  ({
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    merge: jest.fn((entity: T, dto: Partial<T>) => ({ ...entity, ...dto }) as T),
  } as unknown as jest.Mocked<Repository<T>>);

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let skillsRepo: jest.Mocked<Repository<Skill>>;

  beforeEach(async () => {
    usersRepo = makeRepo<User>();
    skillsRepo = makeRepo<Skill>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: userRepoToken, useValue: usersRepo },
        { provide: skillRepoToken, useValue: skillsRepo },
        { provide: APP_CONFIG_TOKEN, useValue: { bcryptSaltRounds: 10 } },
      ],
    }).compile();

    service = module.get(UsersService);

    (bcryptjs.compare as jest.Mock).mockResolvedValue(false);
    (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('findAll (pagination)', () => {
    it('возвращает данные и корректную meta', async () => {
      const data: DeepPartial<User>[] = [
        { id: 1, roles: [UserRole.USER] } as any,
        { id: 2, roles: [UserRole.ADMIN] } as any,
      ];
      usersRepo.findAndCount.mockResolvedValueOnce([data as User[], 23]);

      const res = await service.findAll({ page: 2, limit: 10 });

      expect(usersRepo.findAndCount).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        order: { id: 'ASC' },
      });
      expect(res.data).toHaveLength(2);
      expect(res.meta).toEqual({
        currentPage: 2,
        itemsPerPage: 10,
        totalItems: 23,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('кидает BadRequest на невалидных значениях', async () => {
      await expect(service.findAll({ page: -1, limit: 10 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findAll({ page: 1, limit: -1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('по умолчанию page=1, limit=10', async () => {
      usersRepo.findAndCount.mockResolvedValueOnce([[], 0]);
      await service.findAll();
      expect(usersRepo.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { id: 'ASC' },
      });
    });
  });

  describe('findOne / findById', () => {
    it('findOne использует findOneOrFail', async () => {
      const user = { id: 7 } as User;
      usersRepo.findOneOrFail.mockResolvedValueOnce(user);
      await expect(service.findOne(7)).resolves.toBe(user);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledWith({ where: { id: 7 } });
    });

    it('findById также использует findOneOrFail', async () => {
      const user = { id: 9 } as User;
      usersRepo.findOneOrFail.mockResolvedValueOnce(user);
      await expect(service.findById(9)).resolves.toBe(user);
      expect(usersRepo.findOneOrFail).toHaveBeenCalledWith({ where: { id: 9 } });
    });
  });

  describe('updatePassword', () => {
    const baseUser = {
      id: 3,
      password: 'hash-of-old',
      email: 'u@mail.com',
    } as User;

    it('404, если пользователь не найден', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null as any);
      await expect(
        service.updatePassword(3, { currentPassword: 'a', newPassword: 'b' }),
      ).rejects.toThrow(new NotFoundException('Пользователь не найден'));
    });

    it('401, если текущий пароль неверен', async () => {
      usersRepo.findOne.mockResolvedValueOnce(baseUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValueOnce(false);
      await expect(
        service.updatePassword(3, { currentPassword: 'wrong', newPassword: 'new' }),
      ).rejects.toThrow(new UnauthorizedException('Текущий пароль неверен'));
    });

    it('400, если новый пароль совпадает со старым', async () => {
      usersRepo.findOne.mockResolvedValueOnce(baseUser);
      (bcryptjs.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      await expect(
        service.updatePassword(3, { currentPassword: 'old', newPassword: 'old' }),
      ).rejects.toThrow(
        new BadRequestException('Новый пароль должен отличаться от текущего'),
      );
    });

    it('успешно хеширует новый пароль и вызывает update', async () => {
      usersRepo.findOne.mockResolvedValueOnce(baseUser);
      (bcryptjs.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (bcryptjs.hash as jest.Mock).mockResolvedValueOnce('new-hash');

      await service.updatePassword(3, {
        currentPassword: 'old',
        newPassword: 'new',
      });

      expect(bcryptjs.hash).toHaveBeenCalledWith('new', 10);
      expect(usersRepo.update).toHaveBeenCalledWith(3, { password: 'new-hash' });
    });
  });

  describe('update (profile)', () => {
    it('404, если нет пользователя', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null as any);
      await expect(
        service.update(5, { firstName: 'A' } as any),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('мерджит, сохраняет и скрывает чувствительные поля', async () => {
      const existing = {
        id: 5,
        email: 'a@a',
        password: 'hash',
        refreshToken: 'rt',
        roles: [UserRole.USER],
      } as unknown as User;

      usersRepo.findOne.mockResolvedValueOnce(existing);
      usersRepo.save.mockResolvedValueOnce({
        ...existing,
        firstName: 'Alex',
      } as User);

      const res = await service.update(5, { firstName: 'Alex' } as any);

      expect(usersRepo.merge).toHaveBeenCalled();
      expect(usersRepo.save).toHaveBeenCalled();
      expect((res as any).password).toBeUndefined();
      expect((res as any).refreshToken).toBeUndefined();
      expect(res).toMatchObject({ id: 5, email: 'a@a', firstName: 'Alex' });
    });
  });

  describe('findBySkill', () => {
    it('404, если скилл не найден', async () => {
      skillsRepo.findOne.mockResolvedValueOnce(null as any);
      await expect(service.findBySkill(1)).rejects.toThrow(
        new NotFoundException('Навык не найден'),
      );
    });

    it('404, если у навыка нет владельца', async () => {
      skillsRepo.findOne.mockResolvedValueOnce({ id: 1 } as any);
      await expect(service.findBySkill(1)).rejects.toThrow(
        new NotFoundException('Навык существует, но у него нет владельца'),
      );
    });

    it('возвращает пользователей с подходящими категориями', async () => {
      const owner = { wantToLearn: [{ id: 11 }, { id: 22 }] } as any;
      skillsRepo.findOne.mockResolvedValueOnce({ id: 1, owner } as any);
      usersRepo.find.mockResolvedValueOnce([{ id: 7 }, { id: 8 }] as any);

      const res = await service.findBySkill(1);

      expect(usersRepo.find).toHaveBeenCalledWith({
        where: { wantToLearn: { id: expect.any(Object) } },
        relations: ['wantToLearn'],
        take: 10,
      });
      expect(res).toHaveLength(2);
    });
  });

  describe('remove', () => {
    it('возвращает строку-заглушку', () => {
      expect(service.remove(1)).toBe('This action removes a #1 user');
    });
  });
});
