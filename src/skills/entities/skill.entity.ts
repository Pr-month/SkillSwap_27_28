import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Length,
} from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty({ message: 'Название навыка обязательно' })
  @Length(2, 100, {
    message: 'Название навыка должно быть от 2 до 100 символов',
  })
  title: string;

  @Column('text')
  @IsOptional()
  @Length(0, 1000, { message: 'Описание не должно превышать 1000 символов' })
  description: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn()
  @IsNotEmpty({ message: 'Категория обязательна' })
  category: Category;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Images должно быть массивом' })
  @IsUrl({}, { each: true, message: 'Каждая ссылка должна быть валидным URL' })
  images: string[];

  // @ManyToOne(() => User, (user) => user.skills)  //toDo расскоментировать, когда у skills появится модуль
  // @JoinColumn()
  // @IsNotEmpty({ message: 'Владелец навыка обязателен' })
  // owner: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
