import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AllSkillsDto {
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @IsNumber()
  @Type(() => Number)
  limit: number = 20;

  @IsString()
  search: string = '';

  @IsString()
  category?: string;
}

export class SkillDto {
  @IsString()
  title: string;

  @IsString()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  images?: string[];

  //   @IsNumber()
  //   owner: number;
}
