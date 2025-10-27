import { Test } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { UserRole } from '../users/users.enums';

describe('RequestsController', () => {
  let controller: RequestsController;
  const service = {
    create: jest.fn(),
    getIncoming: jest.fn(),
    getOutgoing: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const req = { user: { _id: 11, role: UserRole.USER } } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(RequestsController);
    jest.clearAllMocks();
  });

  it('create', async () => {
    await controller.create(
      { offeredSkillId: 1, requestedSkillId: 2 } as any,
      req,
    );
    expect(service.create).toHaveBeenCalledWith(
      { offeredSkillId: 1, requestedSkillId: 2 },
      11,
    );
  });

  it('incoming/outgoing', async () => {
    await controller.getIncoming(req);
    expect(service.getIncoming).toHaveBeenCalledWith(11);
    await controller.getOutgoing(req);
    expect(service.getOutgoing).toHaveBeenCalledWith(11);
  });

  it('update', async () => {
    await controller.update('rid', { isRead: true } as any, req);
    expect(service.update).toHaveBeenCalledWith(
      'rid',
      { isRead: true },
      11,
      UserRole.USER,
    );
  });

  it('remove', async () => {
    await controller.remove('rid', req);
    expect(service.remove).toHaveBeenCalledWith('rid', 11, UserRole.USER);
  });
});
