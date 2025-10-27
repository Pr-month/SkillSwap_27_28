jest.setTimeout(20000);

jest.mock(
  'src/config/jwt.config',
  () => ({
    jwtConfig: { KEY: 'JWT_CONFIG_TOKEN' },
  }),
  { virtual: true },
);

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { WsJwtGuard } from 'src/notifications/guards/ws-jwt.guard';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';

describe('E2E /notifications (WebSocket gateway)', () => {
  let app: INestApplication;
  let gateway: NotificationsGateway;
  let baseUrl: string;

  const wsJwtGuardMock = {
    verifyToken: jest.fn((client: any) => {
      const token = client?.handshake?.auth?.token;
      if (token === 'bad') {
        throw new Error('Invalid token');
      }
      const userId = client?.handshake?.auth?.userId ?? 123;
      client.data = { user: { _id: userId } };
    }),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [NotificationsModule],
    })
      .overrideProvider(WsJwtGuard)
      .useValue(wsJwtGuardMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
    gateway = moduleRef.get(NotificationsGateway);
  });

  afterAll(async () => {
    await app.close();
  });

  const connectClient = (auth?: Record<string, any>): Promise<ClientSocket> =>
    new Promise((resolve, reject) => {
      const client = io(`${baseUrl}/notifications`, {
        transports: ['websocket'],
        reconnection: false,
        forceNew: true,
        timeout: 5000,
        auth,
      });

      const onError = (err: any) => {
        cleanup();
        reject(err);
      };

      const onDisconnectEarly = () => {
        cleanup();
        reject(new Error('Disconnected before connect'));
      };

      const onConnect = () => {
        client.off('connect_error', onError);
        client.off('disconnect', onDisconnectEarly);
        resolve(client);
      };

      const cleanup = () => {
        client.off('connect', onConnect);
        client.off('connect_error', onError);
        client.off('disconnect', onDisconnectEarly);
      };

      client.on('connect', onConnect);
      client.on('connect_error', onError);
      client.on('disconnect', onDisconnectEarly);
    });

  const closeClient = (client: ClientSocket | undefined | null) =>
    new Promise<void>((resolve) => {
      if (!client) return resolve();
      if (client.connected) {
        client.once('disconnect', () => resolve());
        client.disconnect();
      } else {
        resolve();
      }
    });

  it('успешно коннектится при валидном токене и получает событие из notifyNewRequest', async () => {
    const userId = 42;
    const client = await connectClient({ token: 'good', userId });

    const payloadPromise = new Promise<any>((resolve) => {
      client.once('notificateNewRequest', (data) => resolve(data));
    });

    gateway.notifyNewRequest(userId, 'Привет!', { extra: 1 });

    const payload = await payloadPromise;

    expect(wsJwtGuardMock.verifyToken).toHaveBeenCalled();
    expect(payload).toMatchObject({
      type: 'NEW_REQUEST',
      message: 'Привет!',
      extra: 1,
    });
    expect(new Date(payload.timestamp).toString()).not.toBe('Invalid Date');

    await closeClient(client);
  });

  it('отклоняет подключение при ошибке в verifyToken (disconnect)', async () => {
    const client = io(`${baseUrl}/notifications`, {
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
      timeout: 5000,
      auth: { token: 'bad' },
    });

    const result = await new Promise<'connect_error' | 'disconnect'>(
      (resolve) => {
        client.once('connect_error', () => resolve('connect_error'));
        client.once('disconnect', () => resolve('disconnect'));
      },
    );

    expect(['connect_error', 'disconnect']).toContain(result);

    await closeClient(client);
  });

  it('notifyRequestRejected шлёт корректное сообщение и тип', async () => {
    const userId = 77;
    const client = await connectClient({ token: 'good', userId });

    const payloadPromise = new Promise<any>((resolve) => {
      client.once('notificateNewRequest', (data) => resolve(data));
    });

    gateway.notifyRequestRejected(userId, 'Гитара', 'Иван');

    const payload = await payloadPromise;

    expect(payload.type).toBe('REQUEST_REJECTED');
    expect(payload.skillName).toBe('Гитара');
    expect(payload.rejectedBy).toBe('Иван');
    expect(payload.message).toContain('была отклонена пользователем Иван');
    expect(new Date(payload.timestamp).toString()).not.toBe('Invalid Date');

    await closeClient(client);
  });
});
