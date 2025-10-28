import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const serviceMock = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('logout delegates', async () => {
    const req: any = { user: { userId: 4 } };

    serviceMock.logout.mockResolvedValueOnce({ message: 'ok' });

    await expect(controller.logout(req)).resolves.toEqual({ message: 'ok' });
    expect(serviceMock.logout).toHaveBeenCalledWith(4);
  });

  it('refresh delegates', async () => {
    const req: any = { user: { userId: 2 } };

    serviceMock.refreshTokens.mockResolvedValueOnce({
      message: 'Токены обновлены',
      accessToken: 'a2',
      refreshToken: 'r2',
    });

    await expect(controller.refresh(req)).resolves.toEqual({
      message: 'Токены обновлены',
      accessToken: 'a2',
      refreshToken: 'r2',
    });

    expect(serviceMock.refreshTokens).toHaveBeenCalledWith(2);
  });
});
