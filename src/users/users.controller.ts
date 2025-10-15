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
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AuthRequest } from '../auth/types';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './users.enums';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Список пользователей (только админ)' })
  @ApiResponse({ status: 200, description: 'OK', type: [User] })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
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
  updateCurrentUser(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
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
  async findBySkill(@Param('id') skillId: string): Promise<User[]> {
    return this.usersService.findBySkill(+skillId);
  }
}
