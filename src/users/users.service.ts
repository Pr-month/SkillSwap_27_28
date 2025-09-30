import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserResponseDto } from './dto/user-response.dto';
import { ConfigService } from '@nestjs/config';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcryptjs from 'bcrypt';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

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

  findAll() {
    return this.usersRepository.find({
      select: ['id', 'name', 'email', 'about', 'city', 'avatar', 'role'], // исключаем пароль
    });
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'about', 'birthdate', 'city', 'gender', 'avatar', 'skills', 'role'], // исключаем пароль и refreshToken
      relations: ['favoriteSkills'], // если нужны связанные навыки
    });
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'about', 'birthdate', 'city', 'gender', 'avatar', 'skills', 'role'], // исключаем чувствительные данные
      relations: ['favoriteSkills'], // добавляем связанные навыки
    });
    
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    
    return user;
  }

  async updatePassword(userId: number, updatePasswordDto: UpdatePasswordDto): Promise<void> {
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
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Текущий пароль неверен');
    }

    // Проверяем, что новый пароль отличается от текущего
    const isSamePassword = await bcryptjs.compare(
      updatePasswordDto.newPassword,
      user.password
    );

    if (isSamePassword) {
      throw new BadRequestException('Новый пароль должен отличаться от текущего');
    }

    // Хешируем новый пароль (используем ту же логику, что и в auth.service)
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const hashedPassword = await bcryptjs.hash(updatePasswordDto.newPassword, saltRounds);

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
