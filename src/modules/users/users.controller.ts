import {
  Controller,
  Get,
  UseGuards,
  Req,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

type AuthenticatedRequest = Request & {
  user: { sub: number; email: string };
};
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('api/user')
  async getCurrentUser(@Req() req: AuthenticatedRequest) {
    return this.usersService.getCurrentUserByIdOrThrow(req.user.sub);
  }

  @Put('api/user')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateUser(req.user.sub, body);
  }

  @Get('api/profile/:id')
  async getProfile(@Param('id') id: number) {
    return this.usersService.findByIdOrThrow(id);
  }
}
