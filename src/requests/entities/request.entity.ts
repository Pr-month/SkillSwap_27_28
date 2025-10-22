import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RequestStatus } from '../requests.enums';
import { Skill } from '../../skills/entities/skill.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('requests')
export class Request {
  @ApiProperty({
    description: 'UUID заявки',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Дата создания заявки',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Отправитель заявки',
    type: () => User,
  })
  @ManyToOne(() => User)
  sender: User;

   @ApiProperty({
    description: 'Получатель заявки',
    type: () => User,
  })
  @ManyToOne(() => User)
  receiver: User;

  @ApiProperty({
    description: 'Статус заявки',
    enum: RequestStatus,
    example: RequestStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @ApiProperty({
    description: 'Предлагаемый навык',
    type: () => Skill,
  })
  @ManyToOne(() => Skill)
  offeredSkill: Skill;

  @ApiProperty({
    description: 'Запрашиваемый навык',
    type: () => Skill,
  })
  @ManyToOne(() => Skill)
  requestedSkill: Skill;

  @ApiProperty({
    description: 'Прочитана ли заявка',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  isRead: boolean;
}
