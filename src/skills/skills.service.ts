import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AllSkillsDto, SkillDto } from './dto/skills.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async findAll(dto: AllSkillsDto) {
    const { page = 1, limit = 20, search = '', category } = dto;
    const skip = (page - 1) * limit;
    const query = this.skillsRepository
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.category', 'category')
      .leftJoinAndSelect('category.parent', 'parent')
      .skip(skip)
      .take(limit);
    // Поиск по title (без учета регистра)
    if (search) {
      query.andWhere('LOWER(skill.title) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    // Поиск по категории (category.name или parent.name)
    if (category) {
      query.andWhere('(category.name = :category OR parent.name = :category)', {
        category,
      });
    }
    const [skills, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 0;
    if ((total === 0 && page > 1) || (total > 0 && page > totalPages)) {
      throw new NotFoundException('Страница не найдена');
    }
    return { data: skills, page, totalPages };
  }

  async create(dto: SkillDto, ownerId: number) {
    const owner = await this.userRepository.findOneOrFail({
      where: { id: ownerId },
    });
    const skill = this.skillsRepository.create({
      ...dto,
      owner,
    });
    return await this.skillsRepository.save(skill);
  }

  async update(id: number, dto: SkillDto, ownerId: number) {
    const skill = await this.skillsRepository.findOneBy({ id });
    if (!skill) throw new NotFoundException('Навык не найден');
    if (skill.owner.id !== ownerId) {
      throw new ForbiddenException('Недостаточно прав');
    }
    await this.skillsRepository.update(id, dto);
    return await this.skillsRepository.findOneBy({ id });
  }

  async remove(id: number, ownerId: number) {
    const skill = await this.skillsRepository.findOneBy({ id });
    if (!skill) throw new NotFoundException('Навык не найден');
    if (skill.owner.id !== ownerId) {
      throw new ForbiddenException('Недостаточно прав');
    }
    await this.skillsRepository.delete(id);
    return { message: 'Навык удален' };
  }

  async addToFavorites(skillId: number, userId: number) {
    // Находим навык
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
      relations: ['owner'],
    });

    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    // Находим пользователя с его избранными навыками
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteSkills'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем, не добавлен ли уже навык в избранное
    const isAlreadyFavorite = user.favoriteSkills.some(
      (favSkill) => favSkill.id === skillId,
    );
    if (isAlreadyFavorite) {
      throw new ConflictException('Навык уже в избранном');
    }

    // Добавляем навык в избранное
    user.favoriteSkills.push(skill);
    await this.userRepository.save(user);

    return { message: 'Навык добавлен в избранное' };
  }

  async removeFromFavorites(skillId: number, userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteSkills'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Фильтруем избранные навыки, удаляя указанный
    user.favoriteSkills = user.favoriteSkills.filter(
      (favSkill) => favSkill.id !== skillId,
    );
    await this.userRepository.save(user);

    return { message: 'Навык удален из избранного' };
  }

  async getFavorites(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteSkills', 'favoriteSkills.owner'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user.favoriteSkills;
  }
}
