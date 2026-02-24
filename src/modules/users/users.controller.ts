import {
  Controller,
  Get,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { i18n } from 'src/helpers/common';

type AuthenticatedRequest = Request & {
  user: { sub: number; email: string };
};
@Controller('api/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@Req() req: AuthenticatedRequest) {
    const payload = req.user;
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new NotFoundException(i18n()?.t('error.validation.userNotFound'));
    }

    return { user: { id: user?.id, email: user?.email } };
  }
}
