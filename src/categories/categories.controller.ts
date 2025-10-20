import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto/category.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../src/users/users.enums';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Список основных категорий с подкатегориями' })
  @ApiResponse({
    status: 200,
    description: 'Корневые категории с массивом children',
  })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Создать категорию (только админ)' })
  @ApiBody({ type: CategoryDto })
  @ApiResponse({ status: 201, description: 'Создано' })
  @ApiUnauthorizedResponse({ description: 'Нужен действующий access token' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async create(@Body() dto: CategoryDto) {
    return this.categoriesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить категорию (только админ)' })
  @ApiBody({ type: CategoryDto })
  @ApiResponse({ status: 200, description: 'Обновлено' })
  @ApiUnauthorizedResponse({ description: 'Нужен действующий access token' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async update(@Param('id') id: number, @Body() dto: CategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить категорию (только админ)' })
  @ApiResponse({ status: 200, description: 'Удалено' })
  @ApiUnauthorizedResponse({ description: 'Нужен действующий access token' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async remove(@Param('id') id: number) {
    return this.categoriesService.remove(id);
  }
}
