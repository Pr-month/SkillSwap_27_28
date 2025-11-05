import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const authServiceMock = {
  register: jest.fn().mockResolvedValue({
    message: 'Пользователь успешно зарегистрирован',
    tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
    user: { id: 1, name: 'Test', email: 'test@example.com' },
  }),
  login: jest.fn().mockResolvedValue({
    message: 'Вход выполнен',
    accessToken: 'mock-access',
    refreshToken: 'mock-refresh',
    user: { id: 1, email: 'test@example.com', name: 'Test User' },
  }),
  logout: jest.fn().mockResolvedValue({ message: 'Выход выполнен' }),
  refreshTokens: jest.fn().mockResolvedValue({
    message: 'Токены обновлены',
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
  }),
};

describe('AuthController (unit)', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('refresh delegates', async () => {
    const req: any = { user: { _id: 2 } };

    authServiceMock.refreshTokens.mockResolvedValueOnce({
      message: 'Токены обновлены',
      accessToken: 'a2',
      refreshToken: 'r2',
    });

    await expect(controller.refresh(req)).resolves.toEqual({
      message: 'Токены обновлены',
      accessToken: 'a2',
      refreshToken: 'r2',
    });

    expect(authServiceMock.refreshTokens).toHaveBeenCalledWith(2);
  });

  it('register: вызывает сервис и возвращает результат', async () => {
    const dto = {
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
      city: 'Moscow',
    };
    const res = await controller.register(dto as any);
    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    expect(res).toMatchObject({
      message: 'Пользователь успешно зарегистрирован',
    });
  });

  it('login: вызывает сервис и возвращает результат', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const res = await controller.login(dto as any);
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(res).toMatchObject({ message: 'Вход выполнен' });
  });

  it('refresh: вызывает сервис с _id из запроса', async () => {
    const mockReq = { user: { _id: 1 } } as any;
    const res = await controller.refresh(mockReq);
    expect(authServiceMock.refreshTokens).toHaveBeenCalledWith(1);
    expect(res).toMatchObject({ message: 'Токены обновлены' });
  });

  it('logout: вызывает сервис с _id из запроса', async () => {
    const mockReq = { user: { _id: 1 } } as any;
    const res = await controller.logout(mockReq);
    expect(authServiceMock.logout).toHaveBeenCalledWith(1);
    expect(res).toMatchObject({ message: 'Выход выполнен' });
  });
});
