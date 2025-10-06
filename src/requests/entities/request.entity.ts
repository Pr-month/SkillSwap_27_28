import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RequestStatus } from '../requests.enums';
import { Skill } from '../../skills/entities/skill.entity';

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  createdAt: Date;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => User)
  receiver: User;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @ManyToOne(() => Skill)
  offeredSkill: Skill;

  @ManyToOne(() => Skill)
  requestedSkill: Skill;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;
}
