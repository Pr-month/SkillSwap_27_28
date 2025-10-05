import { IsString, MinLength, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @IsString({ message: 'Текущий пароль должен быть строкой' })
  currentPassword: string;

  @IsString({ message: 'Новый пароль должен быть строкой' })
  @MinLength(6, { message: 'Новый пароль должен быть не менее 6 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Новый пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру',
  })
  newPassword: string;
}
