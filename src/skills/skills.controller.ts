import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SkillDto, AllSkillsDto } from './dto/skills.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AuthRequest } from '../auth/types';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Skill } from './entities/skill.entity';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  //получить список навыков
  @ApiOperation({ summary: 'Получить список всех навыков' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список навыков успешно получен',
    type: [Skill]
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @Get()
  async findAll(@Query() dto: AllSkillsDto) {
    return await this.skillsService.findAll(dto);
  }
  //создать навык
  @ApiOperation({ summary: 'Создать новый навык' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.CREATED, 
    description: 'Навык успешно создан',
    type: Skill
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Пользователь не авторизован' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Неверные данные запроса' 
  })
  @ApiBody({ type: SkillDto })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: SkillDto, @Req() req: AuthRequest) {
    return await this.skillsService.create(dto, req.user._id);
  }

  //обновление навыка
  @ApiOperation({ summary: 'Обновить навык' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Навык успешно обновлен',
    type: Skill 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Навык не найден' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Недостаточно прав для обновления' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Пользователь не авторизован' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID навыка' 
  })
  @ApiBody({ type: SkillDto })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: SkillDto,
    @Req() req: AuthRequest,
  ) {
    return await this.skillsService.update(id, dto, req.user._id);
  }
  //удаление навыка
   @ApiOperation({ summary: 'Удалить навык' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Навык успешно удален' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Навык не найден' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Недостаточно прав для удаления' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Пользователь не авторизован' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID навыка' 
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: AuthRequest) {
    return await this.skillsService.remove(id, req.user._id);
  }

  // Добавить навык в избранное
   @ApiOperation({ summary: 'Добавить навык в избранное' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Навык добавлен в избранное' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Навык или пользователь не найден' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Навык уже в избранном' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Пользователь не авторизован' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID навыка' 
  })
  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  async addToFavorites(@Param('id') id: number, @Req() req: AuthRequest) {
    return await this.skillsService.addToFavorites(id, req.user._id);
  }

  // Удалить навык из избранного
  @ApiOperation({ summary: 'Удалить навык из избранного' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Навык удален из избранного' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Пользователь не найден' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Пользователь не авторизован' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID навыка' 
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  async removeFromFavorites(@Param('id') id: number, @Req() req: AuthRequest) {
    return await this.skillsService.removeFromFavorites(id, req.user._id);
  }

  // Получить избранные навыки пользователя
   @ApiOperation({ summary: 'Получить избранные навыки пользователя' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Список избранных навыков получен',
    type: [Skill] 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Пользователь не найден' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Пользователь не авторизован' 
  })
  @UseGuards(JwtAuthGuard)
  @Get('favorites/my')
  async getFavorites(@Req() req: AuthRequest) {
    return await this.skillsService.getFavorites(req.user._id);
  }
}
