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

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
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

    return await this.requestRepository.save(request);
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

    if (dto.status !== undefined) {
      request.status = dto.status;
    }
    if (dto.isRead !== undefined) {
      request.isRead = dto.isRead;
    }

    return await this.requestRepository.save(request);
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
