import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})], 
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenGuard,
    RefreshTokenStrategy
  ],
})
export class AuthModule {}
