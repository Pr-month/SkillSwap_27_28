import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Category } from '../categories/entities/category.entity';

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
  let skillsRepo: jest.Mocked<Partial<Repository<Skill>>>;
  let usersRepo: jest.Mocked<Partial<Repository<User>>>;
  let categoriesRepo: jest.Mocked<Partial<Repository<Category>>>;

  beforeEach(async () => {
    skillsRepo = {
      createQueryBuilder: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    usersRepo = {
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    categoriesRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: skillsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Category), useValue: categoriesRepo },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll: возвращает пагинацию', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
    };
    (skillsRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    const res = await service.findAll({
      page: 1,
      limit: 20,
      search: '',
      category: undefined,
    } as AllSkillsDto);
    expect(res).toEqual({ data: [{ id: 1 }], page: 1, totalPages: 1 });
  });

  it('findAll: NotFound на несуществующей странице', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    (skillsRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    await expect(
      service.findAll({ page: 2, limit: 20, search: '' } as AllSkillsDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create: создание навыка', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue({ id: 10 });
    (categoriesRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'programming',
    });

    (skillsRepo.create as jest.Mock).mockReturnValue({
      title: 'TestSkill',
      owner: { id: 10 },
      category: { id: 1 },
    });
    (skillsRepo.save as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'TestSkill',
      owner: { id: 10 },
      category: { id: 1 },
    });

    const res = await service.create(
      {
        title: 'TestSkill',
        category: 'programming',
      } as SkillDto,
      10,
    );

    expect(res).toMatchObject({ id: 1, title: 'TestSkill', owner: { id: 10 } });
    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it('update: обновление навыка', async () => {
    (skillsRepo.findOne as jest.Mock)
      .mockResolvedValueOnce({
        id: 1,
        title: 'Old Skill',
        owner: { id: 5 },
        category: { id: 1, name: 'programming' },
      })
      .mockResolvedValueOnce({
        id: 1,
        title: 'TestSkill',
        owner: { id: 5 },
        category: { id: 1, name: 'programming' },
      });

    (skillsRepo.save as jest.Mock).mockResolvedValue({} as any);

    const res = await service.update(1, { title: 'TestSkill' } as SkillDto, 5);
    expect(skillsRepo.save).toHaveBeenCalled();
    expect(res).toMatchObject({ id: 1, title: 'TestSkill' });
  });

  it('update: запрет обновления если User не владелец навыка', async () => {
    (skillsRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Test Skill',
      owner: { id: 99 },
      category: { id: 1, name: 'programming' },
    });

    await expect(
      service.update(1, { title: 'TestSkill' } as SkillDto, 5),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('update: NotFound если навык отсутствует', async () => {
    (skillsRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(
      service.update(1, { title: 'TestSkill' } as SkillDto, 5),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove: удаляет навык владельца', async () => {
    (skillsRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      owner: { id: 5 },
      category: { id: 1, name: 'programming' },
    });
    (skillsRepo.delete as jest.Mock).mockResolvedValue({} as SkillDto);

    const res = await service.create({ title: 'A', category: 'dev' } as any, 7);
    expect(usersRepo.findOne).toHaveBeenCalled();
    expect(categoryRepo.findOne).toHaveBeenCalled();
    expect(skillsRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 1 });
  });

  it('remove: запрет удаления для чужого навыка', async () => {
    (skillsRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      owner: { id: 7 },
      category: { id: 1, name: 'programming' },
    });

    await expect(service.remove(1, 5)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('remove: NotFound если навык отсутствует', async () => {
    (skillsRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.remove(1, 5)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remove: enforces owner and deletes', async () => {
    skillsRepo.findOne!.mockResolvedValue({ id: 1, owner: { id: 7 } });
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
