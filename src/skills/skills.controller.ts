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

type AuthRequest = Request & { user: { id: number } };

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
    return await this.skillsService.create(dto, req.user.id);
  }

  //обновление навыка
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: SkillDto,
    @Req() req: AuthRequest,
  ) {
    return await this.skillsService.update(id, dto, req.user.id);
  }
  //удаление навыка
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: AuthRequest) {
    return await this.skillsService.remove(id, req.user.id);
  }
}
