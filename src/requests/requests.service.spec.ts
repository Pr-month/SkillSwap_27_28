import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { RequestsService } from './requests.service';
import { Request as ReqEntity } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RequestStatus } from './requests.enums';
import { UserRole } from '../users/users.enums';

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
    delete: jest.fn(),
  }) as unknown as MockRepo<T>;

describe('RequestsService', () => {
  let service: RequestsService;
  let reqRepo: MockRepo<ReqEntity>;
  let skillRepo: MockRepo<Skill>;
  const gateway = {
    notifyNewRequest: jest.fn(),
    notifyRequestAccepted: jest.fn(),
    notifyRequestRejected: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(ReqEntity), useValue: repo<ReqEntity>() },
        { provide: getRepositoryToken(Skill), useValue: repo<Skill>() },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();

    service = moduleRef.get(RequestsService);
    reqRepo = moduleRef.get(getRepositoryToken(ReqEntity));
    skillRepo = moduleRef.get(getRepositoryToken(Skill));
    jest.clearAllMocks();
  });

  it('create: validates skills and notifies receiver', async () => {
    const sender = { id: 1, name: 'Alice' } as any;
    const receiver = { id: 2, name: 'Bob' } as any;

    skillRepo
      .findOne!.mockResolvedValueOnce({ id: 10, owner: sender }) 
      .mockResolvedValueOnce({ id: 20, owner: receiver, title: 'React' }); 

    reqRepo.create!.mockReturnValue({
      id: 'req',
      sender,
      receiver,
      requestedSkill: { title: 'React' },
    });
    reqRepo.save!.mockResolvedValue({ id: 'req', sender, receiver });

    const res = await service.create(
      { offeredSkillId: 10, requestedSkillId: 20 },
      1,
    );

    expect(reqRepo.save).toHaveBeenCalled();
    expect(gateway.notifyNewRequest).toHaveBeenCalledWith(
      2,
      expect.stringContaining('Поступила новая заявка'),
      expect.objectContaining({
        type: 'NEW_REQUEST',
        skillName: 'React',
        fromUser: 'Alice',
      }),
    );
    expect(res).toEqual({ id: 'req', sender, receiver });
  });

  it('create: forbids offering not own skill', async () => {
    const other = { id: 9 } as any;
    skillRepo
      .findOne!.mockResolvedValueOnce({ id: 10, owner: other }) 
      .mockResolvedValueOnce({ id: 20, owner: { id: 2 }, title: 'React' }); 

    await expect(
      service.create({ offeredSkillId: 10, requestedSkillId: 20 }, 1),
    ).rejects.toThrow(ForbiddenException);
  });

  it('update: only receiver or admin, and fires ACCEPTED notification', async () => {
    const request = {
      id: 'r1',
      receiver: { id: 5, name: 'Boss' },
      sender: { id: 1 },
      requestedSkill: { title: 'TS' },
      status: RequestStatus.PENDING,
    } as any;

    reqRepo.findOne!.mockResolvedValue(request);
    reqRepo.save!.mockImplementation(async (r) => r);

    const res = await service.update(
      'r1',
      { status: RequestStatus.ACCEPTED },
      5,
      UserRole.USER,
    );
    expect(gateway.notifyRequestAccepted).toHaveBeenCalledWith(1, 'TS', 'Boss');
    expect(res.status).toBe(RequestStatus.ACCEPTED);
  });

  it('update: rejects unauthorized', async () => {
    reqRepo.findOne!.mockResolvedValue({
      id: 'r1',
      receiver: { id: 2 },
    } as any);
    await expect(service.update('r1', {}, 3, UserRole.USER)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('remove: only sender or admin', async () => {
    reqRepo.findOne!.mockResolvedValue({ id: 'r1', sender: { id: 7 } } as any);
    await service.remove('r1', 7, UserRole.USER);
    expect(reqRepo.delete).toHaveBeenCalledWith('r1');
  });

  it('remove: throws not found', async () => {
    reqRepo.findOne!.mockResolvedValue(null);
    await expect(service.remove('x', 1, UserRole.USER)).rejects.toThrow(
      NotFoundException,
    );
  });
});
