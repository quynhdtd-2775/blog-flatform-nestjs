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
