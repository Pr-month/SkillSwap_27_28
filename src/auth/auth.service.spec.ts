import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService, Tokens } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UserRole, Gender } from '../users/users.enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { jwtConfig } from '../config/jwt.config';
import { appConfig } from '../config/app.config';

// Моки
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
  jwtRefreshSecret: 'your_jwt_refresh_secret_key',
  jwtRefreshExpiresIn: '604800s',
};

const mockAppConfig = {
  bcryptSaltRounds: 10,
};

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
        {
          provide: appConfig.KEY,
          useValue: mockAppConfig,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'BCRYPT_SALT_ROUNDS': 10,
      };
      return config[key];
    });

    // Очистка моков перед каждым тестом
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

    const mockTokens: Tokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    beforeEach(() => {
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedPassword'));
    });

    it('should successfully register a new user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword',
        role: UserRole.USER,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        registerDto.password,
        mockAppConfig.bcryptSaltRounds,
      );
      expect(result.message).toBe('Пользователь успешно зарегистрирован');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.name).toBe(registerDto.name);
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.register(registerDto)).rejects.toThrow(
        'Пользователь с таким email уже существует',
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(authService.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(authService.register(registerDto)).rejects.toThrow(
        'Ошибка при регистрации пользователя',
      );
    });

    it('should register user with optional fields', async () => {
      // Arrange
      const minimalRegisterDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      };

      const minimalUser = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
        role: UserRole.USER,
        password: 'hashedPassword',
        refreshToken: 'hashedRefreshToken',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(minimalUser);
      mockUserRepository.save.mockResolvedValue(minimalUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await authService.register(minimalRegisterDto);

      // Assert
      expect(result.user.email).toBe(minimalRegisterDto.email);
      expect(result.user.name).toBe(minimalRegisterDto.name);
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
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
      about: 'About me',
      birthdate: new Date('1990-01-01'),
      city: 'Moscow',
      gender: Gender.MALE,
      avatar: 'avatar.jpg',
      role: UserRole.USER,
      password: 'hashedPassword',
      refreshToken: 'hashedRefreshToken',
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
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
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result.message).toBe('Вход выполнен');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Неверный email или пароль',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Неверный email или пароль',
      );
    });
  });

  describe('logout', () => {
    const userId = 1;

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'John Doe',
    };

    it('should successfully logout user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await authService.logout(userId);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        refreshToken: '',
      });
      expect(result.message).toBe('Выход выполнен');
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.logout(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(authService.logout(userId)).rejects.toThrow(
        'Пользователь не найден',
      );
    });
  });

  describe('refreshTokens', () => {
    const userId = 1;

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: UserRole.USER,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    beforeEach(() => {
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedRefreshToken'));
      mockConfigService.get.mockReturnValue(10);
    });

    it('should successfully refresh tokens', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await authService.refreshTokens(userId);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 10);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        refreshToken: 'hashedRefreshToken',
      });
      expect(result.message).toBe('Токены обновлены');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshTokens(userId)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refreshTokens(userId)).rejects.toThrow(
        'Пользователь не найден',
      );
    });
  });

  describe('_generateTokens', () => {
    const payload = {
      _id: 1,
      email: 'test@example.com',
      role: UserRole.USER,
    };

    it('should generate access and refresh tokens', async () => {
      // Arrange
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await (authService as any)._generateTokens(payload);

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: mockJwtConfig.jwtRefreshSecret,
        expiresIn: mockJwtConfig.jwtRefreshExpiresIn,
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });
});
