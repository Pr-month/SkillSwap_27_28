import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Gender } from '../../users/users.enums';

export class RegisterDto {
  @ApiProperty({ example: 'Иван Иванов', description: 'Имя пользователя' })
  @IsString()
  @Length(2, 50, { message: 'Имя должно быть от 2 до 50 символов' })
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Пароль' })
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не менее 8 символов' })
  password: string;

  @ApiProperty({
    example: 'Информация о себе...',
    description: 'О себе',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, {
    message: 'Информация о себе не должна превышать 500 символов',
  })
  about?: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Дата рождения',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Некорректный формат даты рождения' })
  birthdate?: Date;

  @ApiProperty({ example: 'Москва', description: 'Город', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Пол',
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ description: 'Аватар', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
