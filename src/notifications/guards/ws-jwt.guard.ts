import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { jwtConfig } from '../../config/jwt.config';
import { IJwtConfig } from '../../config/config.types';
import { SocketWithUser } from '../types';
import { JwtPayload } from '../../auth/types';

@Injectable()
export class WsJwtGuard {
  constructor(
    private jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private config: IJwtConfig,
  ) {}

  verifyToken(client: SocketWithUser): void {
    const token = client.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      throw new WsException('Token not provided');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.jwtSecret,
      });

      client.data.user = payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new WsException('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new WsException('Invalid token');
      } else {
        throw new WsException('Token verification failed');
      }
    }
  }
}
