import { IsNumber, IsOptional } from 'class-validator';

export class CategoryDto {
  @IsNumber()
  name: number;

  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}
