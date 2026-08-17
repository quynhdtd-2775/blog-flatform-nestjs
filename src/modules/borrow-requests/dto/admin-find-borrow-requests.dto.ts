import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BorrowRequestStatus } from '../../../database/entities/borrow-request.entity';

export class AdminFindBorrowRequestsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BorrowRequestStatus })
  @IsOptional()
  @IsEnum(BorrowRequestStatus)
  status?: BorrowRequestStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
