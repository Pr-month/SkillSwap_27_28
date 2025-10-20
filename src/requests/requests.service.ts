import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatus } from './requests.enums';
import { UpdateRequestDto } from './dto/update-request.dto';
import { UserRole } from '../users/users.enums';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateRequestDto, senderId: number) {
    const offeredSkill = await this.skillRepository.findOne({
      where: { id: dto.offeredSkillId },
      relations: ['owner'],
    });

    if (!offeredSkill) {
      throw new NotFoundException('Предлагаемый навык не найден');
    }

    const requestedSkill = await this.skillRepository.findOne({
      where: { id: dto.requestedSkillId },
      relations: ['owner'],
    });

    if (!requestedSkill) {
      throw new NotFoundException('Запрашиваемый навык не найден');
    }

    if (offeredSkill.owner.id !== senderId) {
      throw new ForbiddenException('Вы можете предлагать только свои навыки');
    }

    const sender = offeredSkill.owner;
    const receiver = requestedSkill.owner;

    const request = this.requestRepository.create({
      sender,
      receiver,
      offeredSkill,
      requestedSkill,
      status: RequestStatus.PENDING,
      isRead: false,
    });

    // return await this.requestRepository.save(request);
    const savedRequest = await this.requestRepository.save(request);

    // Отправка уведомления получателю о новой заявке
    this.notificationsGateway.notifyNewRequest(
      receiver.id,
      `Поступила новая заявка от ${sender.name}`,
      {
        type: 'NEW_REQUEST',
        skillName: requestedSkill.title,
        fromUser: sender.name,
        requestId: savedRequest.id,
      },
    );

    return savedRequest;
  }

  async getIncoming(userId: number) {
    const requests = await this.requestRepository.find({
      where: {
        receiver: { id: userId },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      order: {
        createdAt: 'DESC',
      },
    });

    return requests;
  }

  async getOutgoing(userId: number) {
    const requests = await this.requestRepository.find({
      where: {
        sender: { id: userId },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      order: {
        createdAt: 'DESC',
      },
    });

    return requests;
  }

  async update(
    id: string,
    dto: UpdateRequestDto,
    userId: number,
    userRole: UserRole,
  ) {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['receiver'],
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.receiver.id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Вы можете обновлять только входящие заявки',
      );
    }

    const previousStatus = request.status;

    if (dto.status !== undefined) {
      request.status = dto.status;
    }
    if (dto.isRead !== undefined) {
      request.isRead = dto.isRead;
    }

    // return await this.requestRepository.save(request);
    const updatedRequest = await this.requestRepository.save(request);

    // Отправка уведомлений при изменении статуса
    if (dto.status !== undefined && dto.status !== previousStatus) {
      const senderName = request.receiver.name; // Исправлено с username на name

      if (dto.status === RequestStatus.REJECTED) {
        // Уведомление отправителю об отклонении
        this.notificationsGateway.notifyRequestRejected(
          request.sender.id,
          request.requestedSkill.title, // Исправлено с name на title
          senderName,
        );
      } else if (dto.status === RequestStatus.ACCEPTED) {
        // Уведомление отправителю о принятии
        this.notificationsGateway.notifyRequestAccepted(
          request.sender.id,
          request.requestedSkill.title, // Исправлено с name на title
          senderName,
        );
      }
    }
    return updatedRequest;
  }

  async remove(id: string, userId: number, userRole: UserRole) {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['sender'],
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.sender.id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Вы можете удалять только свои заявки');
    }

    await this.requestRepository.delete(id);
    return { message: 'Заявка удалена' };
  }
}
