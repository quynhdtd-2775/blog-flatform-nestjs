import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Best programming book I have read.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;
}
