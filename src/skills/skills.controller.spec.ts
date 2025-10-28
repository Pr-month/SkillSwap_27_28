import { Test } from '@nestjs/testing';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

describe('SkillsController', () => {
  let controller: SkillsController;
  const service = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addToFavorites: jest.fn(),
    removeFromFavorites: jest.fn(),
    getFavorites: jest.fn(),
  };

  const req = { user: { _id: 5 } } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [{ provide: SkillsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(SkillsController);
    jest.clearAllMocks();
  });

  it('findAll', async () => {
    service.findAll.mockResolvedValue('ok');
    await expect(controller.findAll({} as any)).resolves.toBe('ok');
  });

  it('create uses req.user._id', async () => {
    await controller.create({ title: 'A' } as any, req);
    expect(service.create).toHaveBeenCalledWith({ title: 'A' }, 5);
  });

  it('update', async () => {
    await controller.update(10 as any, { title: 'x' } as any, req);
    expect(service.update).toHaveBeenCalledWith(10, { title: 'x' }, 5);
  });

  it('remove', async () => {
    await controller.remove(10 as any, req);
    expect(service.remove).toHaveBeenCalledWith(10, 5);
  });

  it('favorites add/remove/get', async () => {
    await controller.addToFavorites(1 as any, req);
    expect(service.addToFavorites).toHaveBeenCalledWith(1, 5);

    await controller.removeFromFavorites(2 as any, req);
    expect(service.removeFromFavorites).toHaveBeenCalledWith(2, 5);

    await controller.getFavorites(req);
    expect(service.getFavorites).toHaveBeenCalledWith(5);
  });
});
