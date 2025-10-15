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
  @IsNotEmpty({ message: 'Аватар обязателен' })
  @IsString()
  avatar: string;
  @IsArray()
  @IsOptional()
  wantToLearn?: string[];
}
