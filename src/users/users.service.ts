import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserResponseDto } from './dto/user-response.dto';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
