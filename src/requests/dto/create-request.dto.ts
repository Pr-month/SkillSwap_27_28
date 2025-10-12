import { IsInt } from 'class-validator';

export class CreateRequestDto {
  @IsInt()
  offeredSkillId: number;

  @IsInt()
  requestedSkillId: number;
}
