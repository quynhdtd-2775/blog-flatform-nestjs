import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBeforeDate } from '../../../common/validators/is-before-date.decorator';
import { i18n } from '../../../helpers/common';

export class BorrowRequestBookDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  bookId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateBorrowRequestDto {
  @ApiProperty({ example: '2026-11-01' })
  @IsDateString()
  @IsBeforeDate('toDate', {
    message: i18n()?.t('error.borrowRequest.invalidDateRange'),
  })
  fromDate!: string;

  @ApiProperty({ example: '2026-11-07' })
  @IsDateString()
  toDate!: string;

  @ApiProperty({ type: [BorrowRequestBookDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BorrowRequestBookDto)
  books!: BorrowRequestBookDto[];
}
