import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({ 
    description: 'ID предлагаемого навыка'
  })
  @IsInt()
  offeredSkillId: number;
  @ApiProperty({
    description: 'ID запрашиваемого навыка',
  })
  @IsInt()
  requestedSkillId: number;
}
