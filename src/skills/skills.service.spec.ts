import { Test, TestingModule } from '@nestjs/testing';
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
import { getRepositoryToken } from '@nestjs/typeorm';
import { AllSkillsDto, SkillDto } from './dto/skills.dto';

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

    const res = await service.remove(1, 5);
    expect(skillsRepo.delete).toHaveBeenCalledWith(1);
    expect(res).toEqual({ message: 'Навык удален' });
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

  it('addToFavorites: добавляет навык в избранное', async () => {
    (skillsRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      owner: { id: 5 },
    });
    const user = { id: 10, favoriteSkills: [] as SkillDto[] };
    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usersRepo.save as jest.Mock).mockResolvedValue({} as any);

    const res = await service.addToFavorites(1, 10);
    expect(user.favoriteSkills).toHaveLength(1);
    expect(usersRepo.save).toHaveBeenCalledWith(user);
    expect(res).toEqual({ message: 'Навык добавлен в избранное' });
  });

  it('addToFavorites: Conflict если уже в избранном', async () => {
    (skillsRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      owner: { id: 5 },
    });
    (usersRepo.findOne as jest.Mock).mockResolvedValue({
      id: 10,
      favoriteSkills: [{ id: 1 }],
    });
    await expect(service.addToFavorites(1, 10)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('addToFavorites: NotFound если навык отсутствует', async () => {
    (skillsRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.addToFavorites(1, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removeFromFavorites: удаляет навык из избранного', async () => {
    const user = { id: 10, favoriteSkills: [{ id: 1 }, { id: 2 }] };
    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usersRepo.save as jest.Mock).mockResolvedValue({} as any);

    const res = await service.removeFromFavorites(1, 10);
    expect(user.favoriteSkills).toEqual([{ id: 2 }]);
    expect(res).toEqual({ message: 'Навык удален из избранного' });
  });

  it('getFavorites: возвращает список избранных навыков', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue({
      id: 10,
      favoriteSkills: [{ id: 1 }, { id: 2 }],
    });

    const res = await service.getFavorites(10);
    expect(res).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('getFavorites: NotFound если пользователя нет', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getFavorites(10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
