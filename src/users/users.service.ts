import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { User } from "./entities/user.entity";
import * as bcryptjs from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }
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

  async findOne(id: number) : Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
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

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    const savedUser = await this.usersRepository.save(updatedUser);
    const { password, refreshToken, ...userWithoutSensitiveData } = savedUser;

    return userWithoutSensitiveData;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
