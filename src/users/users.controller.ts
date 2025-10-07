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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AuthRequest } from '../auth/types';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: AuthRequest) {
    return this.usersService.findById(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
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
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
