import { Exclude } from 'class-transformer';
import { IsDateString, IsEmail, IsOptional, Length } from 'class-validator';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gender, UserRole } from '../users.enums';
import { Skill } from '../../skills/entities/skill.entity';
import { Category } from '../../categories/entities/category.entity';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @ApiProperty({ example: 1, description: 'Идентификатор пользователя' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Иван Иванов', description: 'Имя пользователя' })
  @Column()
  @Length(2, 50, { message: 'Имя должно быть от 2 до 50 символов' })
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @Column({ unique: true })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiHideProperty()
  @Column()
  @Exclude()
  password: string;

  @ApiProperty({
    example: 'Информация о себе...',
    description: 'О себе',
    required: false,
  })
  @Column()
  @IsOptional()
  @Length(0, 500, {
    message: 'Информация о себе не должна превышать 500 символов',
  })
  about: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Дата рождения',
    required: false,
    type: String,
    format: 'date',
  })
  @Column({ type: 'date' })
  @IsDateString({}, { message: 'Некорректный формат даты рождения' })
  @IsOptional()
  birthdate: Date;

  @ApiProperty({ example: 'Москва', description: 'Город', required: false })
  @Column()
  city: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Пол',
    required: false,
    nullable: true,
  })
  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @ApiProperty({
    description: 'Аватар',
    required: false,
  })
  @Column({ nullable: true })
  avatar: string;

  @ApiHideProperty()
  @OneToMany(() => Skill, (skill) => skill.owner)
  skills: Skill[];

  @ApiHideProperty()
  @ManyToMany(() => Category)
  @JoinTable()
  wantToLearn: Category[];

  @ApiHideProperty()
  @ManyToMany(() => Skill)
  @JoinTable()
  favoriteSkills: Skill[];

  @ApiProperty({
    example: UserRole.USER,
    enum: UserRole,
    description: 'Роль пользователя',
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiHideProperty()
  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;
}
