// import { Category } from '../../categories/entities/category.entity';
import { Exclude } from 'class-transformer';
import {
  // MinLength,
  IsDateString,
  IsEmail,
  IsOptional,
  Length,
} from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Gender, UserRole } from '../users.enums';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(2, 50, { message: 'Имя должно быть от 2 до 50 символов' })
  name: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  @IsOptional()
  @Length(0, 500, {
    message: 'Информация о себе не должна превышать 500 символов',
  })
  about: string;

  @Column({ type: 'date' })
  @IsDateString({}, { message: 'Некорректный формат даты рождения' })
  @IsOptional()
  birthdate: Date;

  @Column()
  city: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ nullable: true })
  avatar: string;

  // @OneToMany(() => Skill, (skill) => skill.owner) //toDo расскоментировать, когда у skills появится модуль
  // skills: Skill[];

  // @ManyToMany(() => Category)
  // @JoinTable()
  // wantToLearn: Category[];

  // @ManyToMany(() => Skill)
  // @JoinTable()
  // favoriteSkills: Skill[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;
}
