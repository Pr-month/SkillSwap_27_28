import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { jwtConfig } from '../config/jwt.config';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    NotificationsGateway,
    WsJwtGuard,
    {
      provide: jwtConfig.KEY,
      useFactory: jwtConfig,
    },
  ],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}