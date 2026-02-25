import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsArray()
  tagList?: string[];
}

export class CreateArticleRequestDto {
  @ValidateNested()
  @Type(() => CreateArticleDto)
  article: CreateArticleDto;
}
