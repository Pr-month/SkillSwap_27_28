import { WsJwtGuard } from './ws-jwt.guard';
import { WsException } from '@nestjs/websockets';

describe('WsJwtGuard', () => {
  const jwtService = { verify: jest.fn() };
  const config = { jwtSecret: 'secret' };
  const guard = new WsJwtGuard(jwtService as any, config as any);

  const makeClient = (token?: any) =>
    ({
      handshake: { query: token !== undefined ? { token } : {} },
      data: {},
    } as any);

  beforeEach(() => jest.clearAllMocks());

  it('throws if token not provided', () => {
    const client = makeClient(undefined);
    expect(() => guard.verifyToken(client)).toThrow(
      new WsException('Token not provided'),
    );
  });

  it('sets payload on success', () => {
    jwtService.verify.mockReturnValue({ _id: 1 });
    const client = makeClient('tkn');
    guard.verifyToken(client);
    expect(jwtService.verify).toHaveBeenCalledWith('tkn', { secret: 'secret' });
    expect(client.data.user).toEqual({ _id: 1 });
  });

  it('maps TokenExpiredError', () => {
    jwtService.verify.mockImplementation(() => {
      const e = new Error('x') as any;
      e.name = 'TokenExpiredError';
      throw e;
    });
    const client = makeClient('t');
    expect(() => guard.verifyToken(client)).toThrow(new WsException('Token expired'));
  });

  it('maps JsonWebTokenError', () => {
    jwtService.verify.mockImplementation(() => {
      const e = new Error('x') as any;
      e.name = 'JsonWebTokenError';
      throw e;
    });
    const client = makeClient('t');
    expect(() => guard.verifyToken(client)).toThrow(new WsException('Invalid token'));
  });

  it('maps unknown errors', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('boom');
    });
    const client = makeClient('t');
    expect(() => guard.verifyToken(client)).toThrow(
      new WsException('Token verification failed'),
    );
  });
});
