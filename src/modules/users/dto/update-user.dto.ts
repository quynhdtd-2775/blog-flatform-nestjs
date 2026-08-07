import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'error.validation.email' })
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
