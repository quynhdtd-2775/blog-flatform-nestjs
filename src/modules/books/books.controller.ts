import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CommentsService } from './comments.service';
import { FindBooksDto } from './dto/find-books.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  ImageUploadInterceptor,
  ImagesUploadInterceptor,
} from '../../common/upload/image-upload.interceptor';
import { UploadFileDto } from '../../common/upload/upload-file.dto';
import {
  MAX_COMMENT_IMAGES,
  MAX_COVER_SIZE,
  MAX_REVIEW_IMAGE_SIZE,
} from '../../common/upload/upload.constants';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly commentsService: CommentsService,
  ) {}

  @Get()
  findAll(@Query() query: FindBooksDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Post(':id/comments')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCommentDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    ImagesUploadInterceptor('files', MAX_COMMENT_IMAGES, MAX_REVIEW_IMAGE_SIZE),
  )
  createComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.commentsService.create(id, user.sub, dto, files);
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(ImageUploadInterceptor('file', MAX_COVER_SIZE))
  @Post(':id/cover')
  uploadCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.booksService.updateCover(id, file);
  }
}
