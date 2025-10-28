jest.mock('../src/users/users.enums', () => ({
  UserRole: { USER: 'USER', ADMIN: 'ADMIN' },
  Gender: { MALE: 'MALE', FEMALE: 'FEMALE' },
}));

import { ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../src/auth/types';

jest.mock('../src/auth/guards/jwt.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {
    canActivate(context: ExecutionContext) {
      const httpContext = context.switchToHttp();
      const req = httpContext.getRequest<AuthRequest>();
      req.user = { _id: 1, email: 'test@test.com', role: UserRole.USER };
      return true;
    }
  },
}));

jest.mock('../src/auth/guards/roles.guard', () => ({
  RolesGuard: class RolesGuard {
    canActivate() {
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';

import { RequestsController } from '../src/requests/requests.controller';
import { RequestsService } from '../src/requests/requests.service';
import { RequestStatus } from '../src/requests/requests.enums';
import { CreateRequestDto } from '../src/requests/dto/create-request.dto';
import { UpdateRequestDto } from '../src/requests/dto/update-request.dto';
import { UserRole } from '../src/users/users.enums';

const mockRequest = {
  id: 1,
  status: RequestStatus.PENDING,
  isRead: false,
  sender: { id: 1, name: 'Sender', email: 'sender@test.com' },
  receiver: { id: 2, name: 'Receiver', email: 'receiver@test.com' },
  offeredSkill: { id: 1, title: 'Offered Skill' },
  requestedSkill: { id: 2, title: 'Requested Skill' },
};

const requestsServiceMock = {
  create: jest.fn(),
  getIncoming: jest.fn(),
  getOutgoing: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('E2E /requests (controller + mocked service)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    requestsServiceMock.create.mockResolvedValue({
      ...mockRequest,
      id: 10,
      sender: { id: 1, name: 'Sender' },
    });

    requestsServiceMock.getIncoming.mockResolvedValue([
      {
        ...mockRequest,
        receiver: { id: 1, name: 'Receiver' },
      },
    ]);

    requestsServiceMock.getOutgoing.mockResolvedValue([
      {
        ...mockRequest,
        sender: { id: 1, name: 'Sender' },
      },
    ]);

    requestsServiceMock.update.mockImplementation(
      (id: string, dto: UpdateRequestDto) =>
        Promise.resolve({ ...mockRequest, id: parseInt(id), ...dto }), // Преобразуем string в number
    );

    requestsServiceMock.remove.mockResolvedValue({
      message: 'Заявка удалена',
      id: 5,
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: requestsServiceMock }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /requests → 201 созданная заявка', async () => {
    const createDto: CreateRequestDto = {
      offeredSkillId: 1,
      requestedSkillId: 2,
    };

    const res = await request(app.getHttpServer())
      .post('/requests')
      .send(createDto)
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(Number),
        status: RequestStatus.PENDING,
      }),
    );

    expect(requestsServiceMock.create).toHaveBeenCalledWith(createDto, 1);
  });

  it('GET /requests/incoming, статус 200, получение массива входящих заявок', async () => {
    const res = await request(app.getHttpServer())
      .get('/requests/incoming')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(requestsServiceMock.getIncoming).toHaveBeenCalledWith(1);
  });

  it('GET /requests/outgoing, статус 200, получение массива исходящих заявок', async () => {
    const res = await request(app.getHttpServer())
      .get('/requests/outgoing')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(requestsServiceMock.getOutgoing).toHaveBeenCalledWith(1);
  });

  it('PATCH /requests/:id, статус 200, обновление заявки', async () => {
    const updateDto: UpdateRequestDto = {
      status: RequestStatus.ACCEPTED,
      isRead: true,
    };

    const res = await request(app.getHttpServer())
      .patch('/requests/7')
      .send(updateDto)
      .expect(200);

    expect(res.body).toMatchObject({
      id: 7,
      status: RequestStatus.ACCEPTED,
      isRead: true,
    });
    expect(requestsServiceMock.update).toHaveBeenCalledWith(
      '7',
      updateDto,
      1,
      'USER',
    );
  });

  it('DELETE /requests/:id, статус 200, удаление заявки', async () => {
    const res = await request(app.getHttpServer())
      .delete('/requests/5')
      .expect(200);

    expect(res.body).toEqual({ message: 'Заявка удалена', id: 5 });
    expect(requestsServiceMock.remove).toHaveBeenCalledWith('5', 1, 'USER');
  });
});
