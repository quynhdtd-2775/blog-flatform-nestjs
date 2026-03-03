import { PartialType } from '@nestjs/mapped-types';
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
  @IsString({ message: i18n()?.t('error.validation.titleMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.titleRequired') })
  @MaxLength(50, {
    message: i18n()?.t('error.validation.titleMaxLength'),
  })
  title: string;

  @IsString({ message: i18n()?.t('error.validation.descriptionMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.descriptionRequired') })
  @MaxLength(500, {
    message: i18n()?.t('error.validation.descriptionMaxLength'),
  })
  description: string;

  @IsString({ message: i18n()?.t('error.validation.bodyMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.bodyRequired') })
  @MaxLength(500, {
    message: i18n()?.t('error.validation.bodyMaxLength'),
  })
  body: string;

  @IsOptional()
  @IsArray({ message: i18n()?.t('error.validation.tagListMustBeArray') })
  tagList?: string[];
}
