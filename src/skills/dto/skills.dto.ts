import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AllSkillsDto {
  @ApiProperty({ 
    description: 'Номер страницы', 
    default: 1,
    example: 1 
  })
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({ 
    description: 'Количество элементов на странице', 
    default: 20,
    example: 20 
  })
  @IsNumber()
  @Type(() => Number)
  limit: number = 20;

   @ApiPropertyOptional({ 
    description: 'Поисковый запрос', 
    example: 'программирование' 
  })
  @IsString()
  search: string = '';

  @ApiPropertyOptional({ 
    description: 'Фильтр по категории', 
    example: 'технологии' 
  })
  @IsString()
  category?: string;
}

export class SkillDto {
  @ApiProperty({ 
    description: 'Название навыка', 
    example: 'JavaScript программирование'
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({ 
    description: 'Описание навыка', 
    example: 'Разработка на JavaScript и TypeScript'
  })
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Категория навыка', 
    example: 'программирование' 
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ 
    description: 'Массив ссылок на изображения', 
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String] 
  })
  @IsArray()
  images?: string[];

  //   @IsNumber()
  //   owner: number;
}
