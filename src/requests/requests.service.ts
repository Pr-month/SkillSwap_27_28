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
      order: {
        createdAt: 'DESC',
      },
    });

    return requests;
  }
}
