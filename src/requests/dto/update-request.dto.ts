import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestDto } from './create-request.dto';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { RequestStatus } from '../requests.enums';

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
