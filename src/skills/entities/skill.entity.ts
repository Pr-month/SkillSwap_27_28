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
import { User } from '../../users/entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class Skill {
  @ApiProperty({ description: 'Уникальный идентификатор навыка', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Название навыка',
    example: 'JavaScript программирование',
  })
  @Column()
  @IsNotEmpty({ message: 'Название навыка обязательно' })
  @Length(2, 100, {
    message: 'Название навыка должно быть от 2 до 100 символов',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Описание навыка',
    example: 'Разработка на JavaScript и TypeScript',
  })
  @Column('text')
  @IsOptional()
  @Length(0, 1000, { message: 'Описание не должно превышать 1000 символов' })
  description: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn()
  @IsNotEmpty({ message: 'Категория обязательна' })
  category: Category;

  @ApiPropertyOptional({
    description: 'Массив ссылок на изображения',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
  })
  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Images должно быть массивом' })
  @IsUrl({}, { each: true, message: 'Каждая ссылка должна быть валидным URL' })
  images: string[];

  @ApiProperty({
    description: 'Владелец навыка',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  @IsNotEmpty({ message: 'Владелец навыка обязателен' })
  owner: User;

  @ApiProperty({ description: 'Дата создания навыка' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления навыка' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
