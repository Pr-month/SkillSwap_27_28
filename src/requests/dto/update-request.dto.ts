import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestDto } from './create-request.dto';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { RequestStatus } from '../requests.enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
  @ApiProperty({
    description: 'Статус заказа',
    enum: RequestStatus,
    required: false,
    example: RequestStatus.ACCEPTED,
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiProperty({
    description: 'Прочитана ли заявка',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
