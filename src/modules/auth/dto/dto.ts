import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail({}, { message: 'error.validation.email' })
  @IsNotEmpty({ message: 'error.validation.required' })
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsNotEmpty({ message: 'error.validation.required' })
  @MinLength(6, { message: 'error.validation.minLength', context: { min: 6 } })
  password!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsNotEmpty({ message: 'error.validation.required' })
  name!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail({}, { message: 'error.validation.email' })
  @IsNotEmpty({ message: 'error.validation.required' })
  email!: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsNotEmpty({ message: 'error.validation.required' })
  @MinLength(6, { message: 'error.validation.minLength', context: { min: 6 } })
  password!: string;
}
