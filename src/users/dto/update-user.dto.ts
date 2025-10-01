import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsDateString, IsEnum, IsOptional, Length } from 'class-validator';
import { Gender } from '../users.enums';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @Length(2, 50, { message: 'Имя должно быть от 2 до 50 символов' })
    name?: string;
    
    @IsOptional()
    @Length(0, 500, { message: 'Информация о себе не должна превышать 500 символов' })
    about?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Некорректный формат даты рождения' })
    birthdate?: Date;

    @IsOptional()
    city?: string;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    avatar?: string;
}
