import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { jwtConfig } from '../config/jwt.config';
import { Repository } from 'typeorm';
import { IJwtConfig } from '../config/config.types';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/users.enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { appConfig } from '../config/app.config';
import { JwtPayload } from './types';
import { ConfigService } from '@nestjs/config';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfig: IJwtConfig,
    @Inject(appConfig.KEY)
    private readonly appConfig: { bcryptSaltRounds: number },
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    message: string;
    user: Omit<User, 'password' | 'refreshToken'>;
    tokens: Tokens;
  }> {
    try {
      // Проверяем, существует ли пользователь с таким email
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }

      const saltRounds = this.appConfig.bcryptSaltRounds;
      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        saltRounds,
      );

      // Создаем нового пользователя
      const user = this.userRepository.create({
        ...registerDto,
        password: hashedPassword,
        role: UserRole.USER,
      });

      // Сохраняем пользователя в базе данных
      const savedUser = await this.userRepository.save(user);

      // Генерируем токены
      const tokens = await this._generateTokens({
        _id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      });

      // Хешируем refresh token и сохраняем в БД
      const hashedRefreshToken = await bcrypt.hash(
        tokens.refreshToken,
        saltRounds,
      );
      await this.userRepository.update(savedUser.id, {
        refreshToken: hashedRefreshToken,
      });

      // Убираем пароль и refreshToken из ответа
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, refreshToken, ...userWithoutSensitiveData } = savedUser;

      return {
        message: 'Пользователь успешно зарегистрирован',
        user: userWithoutSensitiveData,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    } catch (error) {
      console.log(error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ошибка при регистрации пользователя',
      );
    }
  }

  private async _generateTokens(payload: JwtPayload): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      // Access token - используем основной JWT модуль
      this.jwtService.signAsync(payload),
      // Refresh token - генерируем с отдельным секретом
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.jwtRefreshSecret,
        expiresIn: this.jwtConfig.jwtRefreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }: LoginDto) {
    //ищем юзера по имэйлу
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    //сверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // генерим токены
    const tokens = await this._generateTokens({
      _id: user.id,
      email: user.email,
      role: user.role,
    });
    // Убираем пароль и refreshToken из ответа

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      password: userPassword,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      refreshToken,
      ...userWithoutSensitiveData
    } = user;
    return {
      message: 'Вход выполнен',
      user: userWithoutSensitiveData,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async logout(userId: number): Promise<{ message: string }> {
    // проверка наличия юзера
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    // Удаляем refresh токен из БД
    await this.userRepository.update(userId, { refreshToken: '' });
    return { message: 'Выход выполнен' };
  }

  async refreshTokens(userId: number) {
    // Находим пользователя
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Генерируем новые токены
    const tokens = await this._generateTokens({
      _id: user.id,
      email: user.email,
      role: user.role,
    });

    // Сохраняем новый refresh token в БД
    const saltRounds =
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      saltRounds,
    );

    await this.userRepository.update(user.id, {
      refreshToken: hashedRefreshToken,
    });

    return {
      message: 'Токены обновлены',
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}
