import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';

const createMockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});
type MockRepo = ReturnType<typeof createMockRepo>;

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repo = module.get(getRepositoryToken(Category));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('тестирование findAll, возвращает корневые категории с детьми', async () => {
    const result = [{ id: 1, name: 'A', children: [] }];
    repo.find.mockResolvedValue(result);

    const data = await service.findAll();

    expect(repo.find).toHaveBeenCalledWith({
      where: { parent: IsNull() },
      relations: ['children'],
    });
    expect(data).toBe(result);
  });

  it('тестирование create, создает без родителя когда parentId не задан', async () => {
    const dto = { name: 999 };
    const created = { id: 1, name: '999', parent: null };

    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);

    const res = await service.create(dto);

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith({ name: '999', parent: null });
    expect(repo.save).toHaveBeenCalledWith(created);
    expect(res).toBe(created);
  });

  it('тестирование update, бросает NotFound если категории нет', async () => {
    repo.findOne.mockResolvedValue(undefined);

    await expect(service.update(1, { name: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('тестирование remove, бросает NotFound если нет категории', async () => {
    repo.findOne.mockResolvedValue(undefined);

    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('удаляет и возвращает сообщение', async () => {
    const entity = { id: 5 };
    repo.findOne.mockResolvedValue(entity);
    repo.remove.mockResolvedValue(undefined);

    const res = await service.remove(5);

    expect(repo.remove).toHaveBeenCalledWith(entity);
    expect(res).toEqual({ message: 'Категория удалена' });
  });
});
