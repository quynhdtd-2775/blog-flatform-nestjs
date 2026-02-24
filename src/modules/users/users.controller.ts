import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';

type AuthenticatedRequest = Request & {
  user: { sub: number; email: string };
};
@Controller('api/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@Req() req: AuthenticatedRequest) {
    return this.usersService.getCurrentUserByIdOrThrow(req.user.sub);
  }
}
