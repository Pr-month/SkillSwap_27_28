import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtGuard)
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  // Обработка подключения
  async handleConnection(client: Socket) {
    try {
      // user добавляется в WsJwtGuard
      const userId = client.data.user.id;
      client.join(userId.toString());
      this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);
    } catch (error) {
      this.logger.error('Connection failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
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
  notifyUser(userId: number, payload: {
    type: string;
    skillName: string;
    fromUser: string;
    message?: string;
  }) {
    this.server.to(userId.toString()).emit('notificateNewRequest', {
      ...payload,
      timestamp: new Date(),
    });
  }

  // Старый метод для обратной совместимости
  // @SubscribeMessage('message')
  // handleMessage(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
}
