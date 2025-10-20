import { Socket } from 'socket.io';
import { JwtPayload } from '../auth/types';

export interface SocketWithUser extends Socket {
  data: {
    user: JwtPayload;
  };
}
