import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { BooksService } from './books.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly booksService: BooksService,
  ) {}

  async create(bookId: number, userId: number, dto: CreateCommentDto) {
    await this.booksService.findOneOrThrow(bookId);

    const comment = this.commentRepo.create({
      book: { id: bookId },
      user: { id: userId },
      content: dto.content,
    });

    const saved = await this.commentRepo.save(comment);

    const commentWithUser = await this.commentRepo.findOneOrFail({
      where: { id: saved.id },
      relations: ['user'],
    });

    return {
      id: commentWithUser.id,
      content: commentWithUser.content,
      createdAt: commentWithUser.createdAt,
      user: {
        id: commentWithUser.user.id,
        name: commentWithUser.user.name,
      },
    };
  }
}
