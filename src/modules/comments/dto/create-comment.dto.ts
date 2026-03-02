import { IsNotEmpty, IsString } from 'class-validator';
import { i18n } from 'src/helpers/common';

export class CreateCommentDto {
  @IsString({ message: i18n()?.t('error.validation.bodyMustString') })
  @IsNotEmpty({ message: i18n()?.t('error.validation.bodyRequired') })
  body: string;
}
