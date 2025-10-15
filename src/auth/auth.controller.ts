import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from './guards/refreshToken.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
  })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email уже существует',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Логин' })
  @ApiResponse({ status: 200, description: 'Успешный логин' })
  @ApiUnauthorizedResponse({ description: 'Авторизация не пройдена' })
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Логаут' })
  @ApiResponse({ status: 200, description: 'Успешный логаут' })
  @ApiUnauthorizedResponse({ description: 'Невалидный refresh token' })
  async logout(
    @Req() req: Request & { user: { userId: number; roles?: string[] } },
  ) {
    return await this.authService.logout(req.user.userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiResponse({
    status: 200,
    description: 'Токены успешно обновлены',
  })
  @ApiResponse({
    status: 401,
    description: 'Невалидный refresh token',
  })
  async refresh(
    @Req() req: Request & { user: { userId: number; email: string } },
  ) {
    return await this.authService.refreshTokens(req.user.userId);
  }
}
