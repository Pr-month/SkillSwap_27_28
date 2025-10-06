import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './entities/user.entity';
import * as bcryptjs from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  // create(createUserDto: CreateUserDto) {
  //   return 'This action adds a new user';
  // }

  async findAll() {
    return await this.usersRepository.find();
  }

  async findOne(id: number) {
    return await this.usersRepository.findOneOrFail({
      where: { id },
      // relations: ['favoriteSkills'],
    });
  }

  async findById(id: number): Promise<User> {
    return await this.usersRepository.findOneOrFail({
      where: { id },
    });
  }

  async updatePassword(
    userId: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    // Находим пользователя с паролем для проверки
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password', 'email'], // получаем пароль для проверки
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем текущий пароль (используем тот же подход, что и в auth.service)
    const isCurrentPasswordValid = await bcryptjs.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Текущий пароль неверен');
    }

    // Проверяем, что новый пароль отличается от текущего
    const isSamePassword = await bcryptjs.compare(
      updatePasswordDto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'Новый пароль должен отличаться от текущего',
      );
    }

    // Хешируем новый пароль (используем ту же логику, что и в auth.service)
    const saltRounds =
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const hashedPassword = await bcryptjs.hash(
      updatePasswordDto.newPassword,
      saltRounds,
    );

    // Обновляем пароль
    await this.usersRepository.update(userId, {
      password: hashedPassword,
    });
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
