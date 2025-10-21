import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class AuthResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: User })
  user: User;

  @ApiProperty({
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
    },
  })
  tokens: { accessToken: string; refreshToken: string };
}
