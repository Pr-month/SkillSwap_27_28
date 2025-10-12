import { IsNumber, IsString } from 'class-validator';

export class CategoryDto {
  @IsString()
  name: string;
  @IsNumber()
  parentId: number;
}
