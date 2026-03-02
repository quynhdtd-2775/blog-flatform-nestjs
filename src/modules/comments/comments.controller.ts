import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { User } from 'src/database/entities/user.entity';

@Controller('articles/:slug/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Req() req: { user: User },
    @Param('slug') slug: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user, createCommentDto, slug);
  }

  @Delete(':id')
  async remove(@Param('slug') slug: string, @Param('id') commentId: number) {
    return this.commentsService.remove(slug, +commentId);
  }
}
