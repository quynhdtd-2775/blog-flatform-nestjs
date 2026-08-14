import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class FindPublishersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}
