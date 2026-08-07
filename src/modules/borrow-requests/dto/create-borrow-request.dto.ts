import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class BorrowRequestBookDto {
  @IsInt()
  @Min(1)
  bookId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateBorrowRequestDto {
  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BorrowRequestBookDto)
  books: BorrowRequestBookDto[];
}
