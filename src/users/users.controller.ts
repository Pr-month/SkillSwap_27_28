import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
  HttpCode,
  HttpStatus,
  Body,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AuthRequest } from '../auth/types';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './users.enums';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  // async findAll(): Promise<User[]> {
  //   return this.usersService.findAll();
  // }
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Текущий пользователь' })
  @ApiResponse({ status: 200, description: 'OK', type: User })
  @ApiUnauthorizedResponse({ description: 'Нужен действующий access token' })
  getCurrentUser(@Request() req: AuthRequest) {
    return this.usersService.findById(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Обновлено', type: User })
  @ApiUnauthorizedResponse({ description: 'Нужен действующий access token' })
  updateCurrentUser(@Request() req: AuthRequest, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user._id, dto);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(+id, updateUserDto);
  // }

  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Сменить пароль текущего пользователя' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiUnauthorizedResponse({ description: 'Нужен действующий access token' })
  async updatePassword(
    @Request() req: AuthRequest,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(req.user._id, updatePasswordDto);
    return {
      message: 'Пароль успешно обновлен',
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить пользователя (только админ)' })
  @ApiResponse({ status: 200, description: 'Удалён' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('by-skill/:id')
  @ApiOperation({
    summary: 'Получить пользователей, у которых навык в избранном',
    description:
      'Возвращает список пользователей, которые добавили указанный навык в избранное',
  })
  @ApiParam({
    name: 'id',
    description: 'ID карточки навыка',
    type: Number,
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей, у которых навык в избранном',
    type: [User],
  })
  @ApiResponse({
    status: 404,
    description: 'Навык не найден',
  })
  @ApiNotFoundResponse({ description: 'Навык не найден' })
  async findBySkill(@Param('id') skillId: number): Promise<User[]> {
    return this.usersService.findBySkill(skillId);
  }
}
