import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { SocketWithUser } from './types';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly wsJwtGuard: WsJwtGuard) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  // Обработка подключения
  async handleConnection(client: SocketWithUser) {
    try {
      this.wsJwtGuard.verifyToken(client);
      const userId = client.data.user._id;

      client.join(userId.toString());
      this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);
    } catch (error) {
      this.logger.error('Connection failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: SocketWithUser) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Уведомление о новой заявке
  notifyNewRequest(userId: number, message: string, payload?: any) {
    this.server.to(userId.toString()).emit('notificateNewRequest', {
      type: 'NEW_REQUEST',
      message,
      timestamp: new Date(),
      ...payload,
    });
    this.logger.log(`Notification sent to user ${userId}: ${message}`);
  }

  // Уведомление об отклонении заявки
  notifyRequestRejected(userId: number, skillName: string, rejectedBy: string) {
    this.server.to(userId.toString()).emit('notificateNewRequest', {
      type: 'REQUEST_REJECTED',
      message: `Ваша заявка на навык "${skillName}" была отклонена пользователем ${rejectedBy}`,
      skillName,
      rejectedBy,
      timestamp: new Date(),
    });
    this.logger.log(`Request rejected notification sent to user ${userId}`);
  }

  // Уведомление о принятии заявки
  notifyRequestAccepted(userId: number, skillName: string, acceptedBy: string) {
    this.server.to(userId.toString()).emit('notificateNewRequest', {
      type: 'REQUEST_ACCEPTED',
      message: `Ваша заявка на навык "${skillName}" была принята пользователем ${acceptedBy}`,
      skillName,
      acceptedBy,
      timestamp: new Date(),
    });
    this.logger.log(`Request accepted notification sent to user ${userId}`);
  }

  // Общий метод для уведомлений
  notifyUser(
    userId: number,
    payload: {
      type: string;
      skillName: string;
      fromUser: string;
      message?: string;
    },
  ) {
    this.server.to(userId.toString()).emit('notificateNewRequest', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
