import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { RequestStatus } from './requests.enums';
import { UserRole } from '../users/users.enums';
import { In } from 'typeorm';

export const createMockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

const mockNotificationsGateway = {
  notifyNewRequest: jest.fn(),
  notifyRequestRejected: jest.fn(),
  notifyRequestAccepted: jest.fn(),
};

type MockRepo = ReturnType<typeof createMockRepo>;

describe('RequestsService', () => {
  let service: RequestsService;
  let requestRepo: MockRepo;
  let skillRepo: MockRepo;
  let notifications: typeof mockNotificationsGateway;

  const mockUser = (id: number) => ({ id, name: `User${id}` });
  const mockSkill = (id: number, ownerId: number) => ({
    id,
    title: `Skill${id}`,
    owner: mockUser(ownerId),
  });
  const dto = { offeredSkillId: 1, requestedSkillId: 2 };
  const requestMock = {
    id: '123',
    receiver: { id: 1 },
    sender: { id: 2 },
    requestedSkill: { title: 'Skill' },
    status: RequestStatus.PENDING,
  };

  beforeEach(async () => {
    requestRepo = createMockRepo();
    skillRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useValue: requestRepo,
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: skillRepo,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    notifications = module.get(NotificationsGateway);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Create: бросает ошибку если skill не найден', async () => {
    skillRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.create(dto, 1)).rejects.toThrow(NotFoundException);
  });

  it('Create: бросает ошибку если requested skill не найден', async () => {
    skillRepo.findOne
      .mockResolvedValueOnce(mockSkill(1, 1))
      .mockResolvedValueOnce(null);
    await expect(service.create(dto, 1)).rejects.toThrow(NotFoundException);
  });

  it('Create: бросает ошибку если offered skill не принадлежит пользователю', async () => {
    skillRepo.findOne
      .mockResolvedValueOnce(mockSkill(1, 100))
      .mockResolvedValueOnce(mockSkill(2, 2));
    await expect(service.create(dto, 1)).rejects.toThrow(ForbiddenException);
  });

  it('Create: создает заявку', async () => {
    const offered = mockSkill(1, 1);
    const requested = mockSkill(2, 2);
    skillRepo.findOne
      .mockResolvedValueOnce(offered)
      .mockResolvedValueOnce(requested);

    const savedRequest = {
      id: 'uuid',
      sender: offered.owner,
      receiver: requested.owner,
      offeredSkill: offered,
      requestedSkill: requested,
      status: RequestStatus.PENDING,
      isRead: false,
    };
    requestRepo.create.mockReturnValue(savedRequest);
    requestRepo.save.mockResolvedValue(savedRequest);

    const result = await service.create(dto, 1);
    expect(result).toEqual(savedRequest);
    expect(notifications.notifyNewRequest).toHaveBeenCalledWith(
      requested.owner.id,
      `Поступила новая заявка от ${offered.owner.name}`,
      {
        type: 'NEW_REQUEST',
        skillName: requested.title,
        fromUser: offered.owner.name,
        requestId: 'uuid',
      },
    );
  });

  it('getIncoming: возвращает входящие заявки', async () => {
    const data = [{ id: '1' }, { id: '2' }];
    requestRepo.find.mockResolvedValue(data);

    const result = await service.getIncoming(1);
    expect(result).toBe(data);
    expect(requestRepo.find).toHaveBeenCalledWith({
      where: {
        receiver: { id: 1 },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      order: { createdAt: 'DESC' },
    });
  });

  it('getOutgoing: возвращает исходящие заявки', async () => {
    const data = [{ id: '1' }];
    requestRepo.find.mockResolvedValue(data);

    const result = await service.getOutgoing(1);
    expect(result).toBe(data);
    expect(requestRepo.find).toHaveBeenCalledWith({
      where: {
        sender: { id: 1 },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      order: { createdAt: 'DESC' },
    });
  });

  it('update: бросает ошибку если request не найден', async () => {
    requestRepo.findOne.mockResolvedValue(null);
    await expect(service.update('123', {}, 1, UserRole.USER)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update: бросает ошибку если пользователь не получатель и не админ', async () => {
    requestRepo.findOne.mockResolvedValue(requestMock);
    await expect(service.update('123', {}, 999, UserRole.USER)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('remove: бросает ошибку если заявка не найдена', async () => {
    requestRepo.findOne.mockResolvedValue(null);
    await expect(service.remove('123', 1, UserRole.USER)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove: запрет на удаление, если не админ и не отправитель', async () => {
    requestRepo.findOne.mockResolvedValue({
      id: '123',
      sender: { id: 2 },
    });
    await expect(service.remove('123', 1, UserRole.USER)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('remove: пользователь удаляет свою заявку', async () => {
    requestRepo.findOne.mockResolvedValue({ sender: { id: 1 } });
    requestRepo.delete.mockResolvedValue(undefined);

    const result = await service.remove('123', 1, UserRole.USER);

    expect(requestRepo.delete).toHaveBeenCalledWith('123');
    expect(result).toEqual({ message: 'Заявка удалена' });
  });

  it('remove: админ может удалить любой запрос', async () => {
    requestRepo.findOne.mockResolvedValue({ sender: { id: 1 } });
    requestRepo.delete.mockResolvedValue(undefined);

    const result = await service.remove('123', 999, UserRole.ADMIN);

    expect(requestRepo.delete).toHaveBeenCalledWith('123');
    expect(result).toEqual({ message: 'Заявка удалена' });
  });
});
