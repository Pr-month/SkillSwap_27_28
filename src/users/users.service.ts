import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcryptjs from 'bcrypt';
import { appConfig, IAppConfig } from '../../src/config';
import { In, Repository } from 'typeorm';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Skill } from '../../src/skills/entities/skill.entity';
import { Category } from '../../src/categories/entities/category.entity';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
    @Inject(appConfig.KEY)
    private configService: IAppConfig,
  ) {}

  // async findAll() {
  //   return await this.usersRepository.find();
  // }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<User>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;

    // Проверка валидности параметров
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive numbers');
    }

    const skip = (page - 1) * limit;

    const [data, totalItems] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: { id: 'ASC' },
    });

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async findOne(id: number) {
    return await this.usersRepository.findOneOrFail({
      where: { id },
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
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password', 'email'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

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
    const saltRounds = this.configService.bcryptSaltRounds;
    const hashedPassword = await bcryptjs.hash(
      updatePasswordDto.newPassword,
      saltRounds,
    );

    // Обновляем пароль
    await this.usersRepository.update(userId, {
      password: hashedPassword,
    });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
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

  async findBySkill(skillId: number): Promise<User[]> {
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
      relations: ['owner', 'owner.wantToLearn'],
    });
    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }
    if (!skill.owner) {
      throw new NotFoundException('Навык существует, но у него нет владельца');
    }
    const wantToLearnIds: number[] = skill.owner.wantToLearn.map(
      (cat: Category) => cat.id,
    );
    if (!wantToLearnIds) {
      return [];
    }
    const findedUsers = await this.usersRepository.find({
      where: {
        wantToLearn: {
          id: In(wantToLearnIds),
        },
      },
      relations: ['wantToLearn'],
      take: 10,
    });
    return findedUsers;
  }
}
