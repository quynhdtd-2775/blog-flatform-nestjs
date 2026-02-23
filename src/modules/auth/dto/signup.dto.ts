import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'error.validation.email' })
  @IsNotEmpty({ message: 'error.validation.required' })
  email: string;

  @IsNotEmpty({ message: 'error.validation.required' })
  @MinLength(6, { message: 'error.validation.minLength', context: { min: 6 } })
  password: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'error.validation.email' })
  @IsNotEmpty({ message: 'error.validation.required' })
  email: string;

  @IsNotEmpty({ message: 'error.validation.required' })
  @MinLength(6, { message: 'error.validation.minLength', context: { min: 6 } })
  password: string;
}
