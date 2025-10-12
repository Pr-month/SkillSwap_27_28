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
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SkillDto, AllSkillsDto } from './dto/skills.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AuthRequest } from '../auth/types';


@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  //получить список навыков
  @Get()
  async findAll(@Query() dto: AllSkillsDto) {
    return await this.skillsService.findAll(dto);
  }
  //создать навык
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: SkillDto, @Req() req: AuthRequest) {
    return await this.skillsService.create(dto, req.user._id);
  }

  //обновление навыка
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
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: AuthRequest) {
    return await this.skillsService.remove(id, req.user._id);
  }

  // Добавить навык в избранное
  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  async addToFavorites(@Param('id') id: number, @Req() req: AuthRequest) {
    return await this.skillsService.addToFavorites(id, req.user._id);
  }

  // Удалить навык из избранного
  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  async removeFromFavorites(@Param('id') id: number, @Req() req: AuthRequest) {
    return await this.skillsService.removeFromFavorites(id, req.user._id);
  }

  // Получить избранные навыки пользователя
  @UseGuards(JwtAuthGuard)
  @Get('favorites/my')
  async getFavorites(@Req() req: AuthRequest) {
    return await this.skillsService.getFavorites(req.user._id);
  }
}
