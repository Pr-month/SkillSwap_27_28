import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const serviceMock = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delegates to service', async () => {
    serviceMock.findAll.mockResolvedValueOnce([{ id: 1 }]);
    await expect(controller.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('create delegates to service', async () => {
    const dto: any = { name: 'cat' };
    serviceMock.create.mockResolvedValueOnce({ id: 1, ...dto });
    await expect(controller.create(dto)).resolves.toEqual({ id: 1, ...dto });
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
  });

  it('update delegates to service', async () => {
    const dto: any = { name: 'new' };
    serviceMock.update.mockResolvedValueOnce({ id: 1, ...dto });
    await expect(controller.update(1 as any, dto)).resolves.toEqual({
      id: 1,
      ...dto,
    });
    expect(serviceMock.update).toHaveBeenCalledWith(1, dto);
  });

  it('remove delegates to service', async () => {
    serviceMock.remove.mockResolvedValueOnce({ message: 'deleted' });
    await expect(controller.remove(1 as any)).resolves.toEqual({
      message: 'deleted',
    });
    expect(serviceMock.remove).toHaveBeenCalledWith(1);
  });
});
