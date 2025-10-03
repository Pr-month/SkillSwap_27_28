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
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto, AllSkillsDto } from './dto/skills.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  //получить список навыков
  @Get()
  findAll(@Query() dto: AllSkillsDto) {
    return this.skillsService.findAll(dto);
  }
  //создать навык
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  //обновление навыка
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateSkillDto) {
    return this.skillsService.update(id, dto);
  }
  //удаление навыка
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.skillsService.remove(id);
  }
}
