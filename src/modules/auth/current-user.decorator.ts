import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../database/entities/user.entity';

export interface AuthenticatedUser {
  sub: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request['user'] as AuthenticatedUser;
  },
);
