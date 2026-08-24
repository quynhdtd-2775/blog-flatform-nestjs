import {
  BadRequestException,
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Put,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ImageUploadInterceptor } from '../../common/upload/image-upload.interceptor';
import { UploadFileDto } from '../../common/upload/upload-file.dto';
import { MAX_AVATAR_SIZE } from '../../common/upload/upload.constants';
import { i18n } from '../../helpers/common';

type AuthenticatedRequest = Request & {
  user: { sub: number; email: string };
};
@ApiTags('Users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('api/user')
  async getCurrentUser(@Req() req: AuthenticatedRequest) {
    return this.usersService.getCurrentUserByIdOrThrow(req.user.sub);
  }

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ImageUploadInterceptor('file', MAX_AVATAR_SIZE))
  @Post('api/user/avatar')
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(i18n()?.t('error.validation.fileRequired'));
    }

    return this.usersService.updateAvatar(req.user.sub, file);
  }
}
