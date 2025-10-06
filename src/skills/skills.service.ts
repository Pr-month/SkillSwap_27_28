import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AllSkillsDto, SkillDto } from './dto/skills.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
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
    const skill = this.skillsRepository.create({
      ...dto,
      ownerId,
    });
    return await this.skillsRepository.save(skill);
  }

  async update(id: number, dto: SkillDto, ownerId: number) {
    const skill = await this.skillsRepository.findOneBy({ id });
    if (!skill) throw new NotFoundException('Навык не найден');
    if (skill.ownerId !== ownerId) {
      throw new ForbiddenException('Недостаточно прав');
    }
    await this.skillsRepository.update(id, dto);
    return await this.skillsRepository.findOneBy({ id });
  }

  async remove(id: number, ownerId: number) {
    const skill = await this.skillsRepository.findOneBy({ id });
    if (!skill) throw new NotFoundException('Навык не найден');
    if (skill.ownerId !== ownerId) {
      throw new ForbiddenException('Недостаточно прав');
    }
    await this.skillsRepository.delete(id);
    return { message: 'Навык удален' };
  }
}
