import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: unknown;
}

export class UploadFilesDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files!: unknown[];
}
