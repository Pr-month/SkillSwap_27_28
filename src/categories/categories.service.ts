import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CategoryDto } from './dto/category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}
  async findAll() {
    return this.categoriesRepository.find({
      where: { parent: IsNull() },
      relations: ['children'],
    });
  }

  async create(dto: CategoryDto) {
    const name = String(dto.name).trim();
    let parent: Category | null = null;
    if (dto.parentId !== undefined && dto.parentId !== null) {
      parent = await this.categoriesRepository.findOne({
        where: { id: dto.parentId },
      });
    }

    const category = this.categoriesRepository.create({ name, parent });
    return this.categoriesRepository.save(category);
  }

  async update(id: number, dto: CategoryDto) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) throw new NotFoundException('Категория не найдена');
    if (dto.name !== undefined) {
      category.name = String(dto.name).trim();
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parent = null;
      } else {
        category.parent = await this.categoriesRepository.findOne({
          where: { id: dto.parentId },
        });
      }
    }

    await this.categoriesRepository.save(category);
    return { message: 'Категория обновлена' };
  }

  async remove(id: number) {
    const existingCategory = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!existingCategory) throw new NotFoundException('Категория не найдена');
    await this.categoriesRepository.remove(existingCategory);
    return { message: 'Категория удалена' };
  }
}
