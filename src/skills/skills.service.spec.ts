import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { User } from '../users/entities/user.entity';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

type MockRepo<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const repo = <T extends ObjectLiteral = any>(): MockRepo<T> =>
  ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findOneOrFail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  }) as unknown as MockRepo<T>;

const qb = () => {
  const self: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };
  return self;
};

describe('SkillsService', () => {
  let service: SkillsService;
  let skillsRepo: MockRepo<Skill>;
  let usersRepo: MockRepo<User>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: repo<Skill>() },
        { provide: getRepositoryToken(User), useValue: repo<User>() },
      ],
    }).compile();

    service = moduleRef.get(SkillsService);
    skillsRepo = moduleRef.get(getRepositoryToken(Skill));
    usersRepo = moduleRef.get(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paged list and applies search/category', async () => {
      const query = qb();
      (skillsRepo.createQueryBuilder as any).mockReturnValue(query);
      query.getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);

      const res = await service.findAll({
        page: 1,
        limit: 20,
        search: 'ts',
        category: 'dev',
      } as any);

      expect(skillsRepo.createQueryBuilder).toHaveBeenCalledWith('skill');
      expect(query.andWhere).toHaveBeenCalled();
      expect(res).toEqual({ data: [{ id: 1 }], page: 1, totalPages: 1 });
    });

    it('throws NotFound when page out of bounds', async () => {
      const query = qb();
      (skillsRepo.createQueryBuilder as any).mockReturnValue(query);
      query.getManyAndCount.mockResolvedValue([[], 0]);

      await expect(
        service.findAll({ page: 2, limit: 10, search: '' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('create: creates with owner', async () => {
    usersRepo.findOneOrFail!.mockResolvedValue({ id: 7 });
    skillsRepo.create!.mockReturnValue({ title: 'A', owner: { id: 7 } });
    skillsRepo.save!.mockResolvedValue({ id: 1 });

    const res = await service.create({ title: 'A' } as any, 7);
    expect(usersRepo.findOneOrFail).toHaveBeenCalled();
    expect(skillsRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 1 });
  });

  it('update: throws when not owner', async () => {
    skillsRepo.findOneBy!.mockResolvedValue({ id: 1, owner: { id: 2 } });
    await expect(service.update(1, { title: 'x' } as any, 7)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('update: happy path', async () => {
    (skillsRepo.findOneBy as any)
      .mockResolvedValueOnce({ id: 1, owner: { id: 7 } })
      .mockResolvedValueOnce({ id: 1, title: 'x' });
    skillsRepo.update!.mockResolvedValue(undefined);

    const res = await service.update(1, { title: 'x' } as any, 7);
    expect(res).toEqual({ id: 1, title: 'x' });
  });

  it('remove: enforces owner and deletes', async () => {
    skillsRepo.findOneBy!.mockResolvedValue({ id: 1, owner: { id: 7 } });
    const res = await service.remove(1, 7);
    expect(skillsRepo.delete).toHaveBeenCalledWith(1);
    expect(res).toEqual({ message: 'Навык удален' });
  });

  describe('favorites', () => {
    it('addToFavorites: conflict if already there', async () => {
      skillsRepo.findOne!.mockResolvedValue({
        id: 3,
        owner: { id: 1 },
        title: 'T',
      });
      usersRepo.findOne!.mockResolvedValue({
        id: 2,
        favoriteSkills: [{ id: 3 }],
      });
      await expect(service.addToFavorites(3, 2)).rejects.toThrow(
        ConflictException,
      );
    });

    it('addToFavorites: success', async () => {
      skillsRepo.findOne!.mockResolvedValue({
        id: 3,
        owner: { id: 1 },
        title: 'T',
      });
      const user: { id: number; favoriteSkills: Array<{ id: number }> } = {
        id: 2,
        favoriteSkills: [],
      };
      usersRepo.findOne!.mockResolvedValue(user as any);
      usersRepo.save!.mockResolvedValue(undefined);

      const res = await service.addToFavorites(3, 2);

      expect(user.favoriteSkills[0].id).toBe(3);
      expect(res).toEqual({ message: 'Навык добавлен в избранное' });
    });

    it('removeFromFavorites: filters out', async () => {
      const user: { id: number; favoriteSkills: Array<{ id: number }> } = {
        id: 2,
        favoriteSkills: [{ id: 3 }, { id: 4 }],
      };
      usersRepo.findOne!.mockResolvedValue(user as any);

      const res = await service.removeFromFavorites(3, 2);

      expect(user.favoriteSkills.map((s) => s.id)).toEqual([4]);
      expect(res).toEqual({ message: 'Навык удален из избранного' });
    });

    it('getFavorites: returns list', async () => {
      usersRepo.findOne!.mockResolvedValue({
        id: 2,
        favoriteSkills: [{ id: 9 }],
        owner: {},
      } as any);
      const res = await service.getFavorites(2);
      expect(res).toEqual([{ id: 9 }]);
    });
  });
});
