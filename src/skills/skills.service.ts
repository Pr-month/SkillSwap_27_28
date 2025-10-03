import { Injectable } from '@nestjs/common';
import { CreateSkillDto, UpdateSkillDto } from './dto/skills.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  findAll() {
    return `This action returns all skills`;
  }
  create(dto: CreateSkillDto) {
    return 'This action adds a new skill';
  }

  update(id: number, dto: UpdateSkillDto) {
    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}
