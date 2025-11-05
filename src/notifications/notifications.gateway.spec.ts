import { Test } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { Logger } from '@nestjs/common';

const toMock = {
  emit: jest.fn(),
  to: function () {
    return this;
  },
};
const serverMock = { to: jest.fn(() => toMock), emit: jest.fn() };

const guardMock = {
  verifyToken: jest.fn(),
};

const loggerLogSpy = jest
  .spyOn(Logger.prototype as any, 'log')
  .mockImplementation(() => {});
const loggerErrSpy = jest
  .spyOn(Logger.prototype as any, 'error')
  .mockImplementation(() => {});

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: WsJwtGuard, useValue: guardMock },
      ],
    }).compile();

    gateway = moduleRef.get(NotificationsGateway);
    gateway.server = serverMock as any;

    jest.clearAllMocks();
  });

  const makeClient = (overrides: Partial<any> = {}) =>
    ({
      id: 'socket-1',
      data: { user: { _id: 42 } },
      join: jest.fn(),
      disconnect: jest.fn(),
      handshake: { query: { token: 'ok' } },
      ...overrides,
    }) as any;

  it('handleConnection: joins room and logs on success', async () => {
    guardMock.verifyToken.mockImplementation(
      (c: any) => (c.data.user = { _id: 77 }),
    );

    const client = makeClient();
    await gateway.handleConnection(client);

    expect(guardMock.verifyToken).toHaveBeenCalledWith(client);
    expect(client.join).toHaveBeenCalledWith('77');
    expect(loggerLogSpy).toHaveBeenCalled();
  });

  it('handleConnection: disconnects on guard error', async () => {
    guardMock.verifyToken.mockImplementation(() => {
      throw new Error('bad');
    });

    const client = makeClient();
    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalled();
    expect(loggerErrSpy).toHaveBeenCalled();
  });

  it('handleDisconnect: logs', () => {
    const client = makeClient();
    gateway.handleDisconnect(client);
    expect(loggerLogSpy).toHaveBeenCalled();
  });

  it('notifyNewRequest: emits correct payload & room', () => {
    gateway.notifyNewRequest(5, 'hello', { extra: 1 });

    expect(serverMock.to).toHaveBeenCalledWith('5');
    expect(toMock.emit).toHaveBeenCalledWith(
      'notificateNewRequest',
      expect.objectContaining({
        type: 'NEW_REQUEST',
        message: 'hello',
        extra: 1,
        timestamp: expect.any(Date),
      }),
    );
  });

  it('notifyRequestRejected: emits correct payload', () => {
    gateway.notifyRequestRejected(9, 'TS', 'Alice');
    expect(serverMock.to).toHaveBeenCalledWith('9');
    expect(toMock.emit.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        type: 'REQUEST_REJECTED',
        skillName: 'TS',
        rejectedBy: 'Alice',
        timestamp: expect.any(Date),
      }),
    );
  });

  it('notifyRequestAccepted: emits correct payload', () => {
    gateway.notifyRequestAccepted(10, 'React', 'Bob');
    expect(serverMock.to).toHaveBeenCalledWith('10');
    expect(toMock.emit.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        type: 'REQUEST_ACCEPTED',
        skillName: 'React',
        acceptedBy: 'Bob',
        timestamp: expect.any(Date),
      }),
    );
  });

  it('notifyUser: generic notifier', () => {
    gateway.notifyUser(15, {
      type: 'X',
      skillName: 'S',
      fromUser: 'U',
      message: 'm',
    });
    expect(serverMock.to).toHaveBeenCalledWith('15');
    expect(toMock.emit).toHaveBeenCalledWith(
      'notificateNewRequest',
      expect.objectContaining({
        type: 'X',
        skillName: 'S',
        fromUser: 'U',
        message: 'm',
        timestamp: expect.any(Date),
      }),
    );
  });
});
