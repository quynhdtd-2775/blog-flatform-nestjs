import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18n } from 'src/helpers/common';

export class CreateArticleDto {
  @IsString({ message: i18n()?.t('error.validation.titleMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.titleRequired') })
  title: string;

  @IsString({ message: i18n()?.t('error.validation.descriptionMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.descriptionRequired') })
  description: string;

  @IsString({ message: i18n()?.t('error.validation.bodyMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.bodyRequired') })
  body: string;

  @IsOptional()
  @IsArray({ message: i18n()?.t('error.validation.tagListMustBeArray') })
  tagList?: string[];
}
