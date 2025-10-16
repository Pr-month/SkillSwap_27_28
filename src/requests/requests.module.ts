import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Request, User, Skill])],
  controllers: [RequestsController],
  providers: [RequestsService, NotificationsGateway],
})
export class RequestsModule {}
