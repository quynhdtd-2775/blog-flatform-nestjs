import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateArticleDto } from './create-article.dto';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { i18n } from 'src/helpers/common';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiProperty({ example: 'How to write clean code' })
  @IsString({ message: i18n()?.t('error.validation.titleMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.titleRequired') })
  @MaxLength(50, {
    message: i18n()?.t('error.validation.titleMaxLength'),
  })
  title!: string;

  @ApiProperty({
    example: 'A short introduction to writing maintainable code.',
  })
  @IsString({ message: i18n()?.t('error.validation.descriptionMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.descriptionRequired') })
  @MaxLength(500, {
    message: i18n()?.t('error.validation.descriptionMaxLength'),
  })
  description!: string;

  @ApiProperty({
    example: 'Full article content goes here...',
  })
  @IsString({ message: i18n()?.t('error.validation.bodyMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.bodyRequired') })
  @MaxLength(500, {
    message: i18n()?.t('error.validation.bodyMaxLength'),
  })
  body!: string;

  @ApiPropertyOptional({ example: ['nestjs', 'clean-code'], type: [String] })
  @IsOptional()
  @IsArray({ message: i18n()?.t('error.validation.tagListMustBeArray') })
  tagList?: string[];
}
