import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService, getConfigToken } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService, Tokens } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UserRole, Gender } from '../users/users.enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockJwtConfig = {
  jwtRefreshSecret: 'refresh-secret',
  jwtRefreshExpiresIn: '7d',
};

const mockAppConfig = {
  bcryptSaltRounds: 10,
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getConfigToken('JWT_CONFIG'), useValue: mockJwtConfig },
        { provide: getConfigToken('APP_CONFIG'), useValue: mockAppConfig },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
      about: 'About me',
      birthdate: new Date('1990-01-01'),
      city: 'Moscow',
      gender: Gender.MALE,
      avatar: 'avatar.jpg',
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'John Doe',
      about: 'About me',
      birthdate: new Date('1990-01-01'),
      city: 'Moscow',
      gender: Gender.MALE,
      avatar: 'avatar.jpg',
      role: UserRole.USER,
      password: 'hashedPassword',
      refreshToken: 'hashedRefreshToken',
    };

    beforeEach(() => {
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedPassword'));
    });

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await authService.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        registerDto.password,
        mockAppConfig.bcryptSaltRounds,
      );
      expect(result.message).toBe('Пользователь успешно зарегистрирован');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));
      await expect(authService.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'John Doe',
      password: 'hashedPassword',
      role: UserRole.USER,
    };

    beforeEach(() => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
    });

    it('should successfully login user with valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.login(loginDto);

      expect(result.message).toBe('Вход выполнен');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  describe('logout', () => {
    const userId = 1;

    it('should successfully logout user', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: userId });
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await authService.logout(userId);
      expect(result.message).toBe('Выход выполнен');
    });
  });

  describe('refreshTokens', () => {
    const userId = 1;

    beforeEach(() => {
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token') // теперь совпадает с тестом
        .mockResolvedValueOnce('refresh-token');
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedRefreshToken'));
      mockConfigService.get.mockReturnValue(10);
    });

    it('should successfully refresh tokens', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: userId });
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await authService.refreshTokens(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 10);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        refreshToken: 'hashedRefreshToken',
      });
      expect(result.message).toBe('Токены обновлены');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  describe('_generateTokens', () => {
    const payload = { _id: 1, email: 'test@example.com', role: UserRole.USER };

    it('should generate access and refresh tokens', async () => {
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await (authService as any)._generateTokens(payload);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });
});
