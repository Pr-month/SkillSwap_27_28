import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
// import { CreateAuthDto } from './dto/create-auth.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/users.enums';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';

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

      // Хешируем пароль
      const saltRounds =
        this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
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
        userId: savedUser.id,
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
        tokens,
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

  private async _generateTokens(payload: {
    userId: number;
    email: string;
    role: UserRole;
  }): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      // Access token - используем основной JWT модуль
      this.jwtService.signAsync(payload),
      // Refresh token - генерируем с отдельным секретом
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '604800',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = loginDto;
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
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Вход выполнен',
      user,
      ...tokens,
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    // проверка наличия юзера
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    // Удаляем refresh токен из БД
    await this.userRepository.update(userId, null);
    return { message: 'Выход выполнен' };
  }
}
