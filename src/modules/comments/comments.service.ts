import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { i18n } from 'src/helpers/common';
import { User } from 'src/database/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from 'src/database/entities/comment.entity';
import { Article } from 'src/database/entities/article.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  private extractUserId(user: User & { sub?: number }) {
    return user.id ?? user.sub;
  }

  async create(user: User, createCommentDto: CreateCommentDto, slug: string) {
    if (!createCommentDto.body) {
      throw new BadRequestException(i18n()?.t('error.validation.required'));
    }

    const authorId = this.extractUserId(user as User & { sub?: number });

    if (!authorId) {
      throw new BadRequestException(
        i18n()?.t('error.validation.invalidUserPayload'),
      );
    }

    const article = await this.articleRepo.findOne({
      where: { slug: slug },
    });

    if (!article) throw new NotFoundException();

    const comment = this.commentRepo.create({
      ...createCommentDto,
      author: {
        id: authorId,
      },
      article: article,
    });

    try {
      const savedComment = await this.commentRepo.save(comment);

      return {
        success: true,
        comment: savedComment,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(i18n()?.t('error.comment.createFailed'));
    }
  }

  async remove(slug: string, commentId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['author'],
    });
    if (!comment) {
      throw new NotFoundException(i18n()?.t('error.comment.notFound'));
    }

    // Allow deletion if user is article author or comment author

    const article = await this.articleRepo.findOne({
      where: { slug: slug },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException(i18n()?.t('error.article.notFound'));
    }

    try {
      await this.commentRepo.remove(comment);

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(i18n()?.t('error.comment.deleteFailed'));
    }
  }
}
