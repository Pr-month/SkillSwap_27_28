import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsDate,
  IsEnum,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Gender } from '../users.enums';
import { Category } from '../../categories/entities/category.entity';
export class CreateUserDto {
  @IsNotEmpty({ message: 'Имя обязательно' })
  @IsString()
  name: string;
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail()
  email: string;
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString()
  password: string;
  @IsNotEmpty({ message: 'Информация о пользователе обязательна' })
  @IsString()
  about: string;
  @IsNotEmpty({ message: 'Дата рождения обязательна' })
  @IsDate()
  birthdate: Date;
  @IsNotEmpty({ message: 'Город обязателен' })
  @IsString()
  city: string;
  @IsNotEmpty({ message: 'Пол обязателен' })
  @IsEnum(Gender)
  gender: Gender;
  @IsString()
  avatar?: string;
  @IsArray()
  @IsOptional()
  wantToLearn?: Category[];
}
