import { BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { memoryStorage } from 'multer';
import { i18n } from '../../helpers/common';
import { IMAGE_EXTENSIONS, IMAGE_MIME_TYPES } from './upload.constants';

export const imageFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const isExtensionValid = IMAGE_EXTENSIONS.includes(
    extname(file.originalname).toLowerCase(),
  );
  const isMimeTypeValid = IMAGE_MIME_TYPES.includes(file.mimetype);

  if (!isExtensionValid || !isMimeTypeValid) {
    callback(
      new BadRequestException(i18n()?.t('error.validation.image')),
      false,
    );
    return;
  }

  callback(null, true);
};

export const ImageUploadInterceptor = (fieldName: string, maxSize: number) =>
  FileInterceptor(fieldName, {
    storage: memoryStorage(),
    fileFilter: imageFileFilter,
    limits: { fileSize: maxSize },
  });

export const ImagesUploadInterceptor = (
  fieldName: string,
  maxCount: number,
  maxSize: number,
) =>
  FilesInterceptor(fieldName, maxCount, {
    storage: memoryStorage(),
    fileFilter: imageFileFilter,
    limits: { fileSize: maxSize },
  });
