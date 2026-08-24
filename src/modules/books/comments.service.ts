import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { CommentImage } from '../../database/entities/comment-image.entity';
import { BooksService } from './books.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(CommentImage)
    private readonly commentImageRepo: Repository<CommentImage>,
    private readonly booksService: BooksService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    bookId: number,
    userId: number,
    dto: CreateCommentDto,
    files: Express.Multer.File[] = [],
  ) {
    await this.booksService.findOneOrThrow(bookId);

    const comment = this.commentRepo.create({
      book: { id: bookId },
      user: { id: userId },
      content: dto.content,
    });

    const saved = await this.commentRepo.save(comment);

    if (files.length > 0) {
      const images = await Promise.all(
        files.map(async (file) => {
          const key = await this.storageService.save({
            buffer: file.buffer,
            originalName: file.originalname,
            folder: 'comments',
          });

          return this.commentImageRepo.create({ comment: saved, path: key });
        }),
      );

      await this.commentImageRepo.save(images);
    }

    const commentWithUser = await this.commentRepo.findOneOrFail({
      where: { id: saved.id },
      relations: ['user', 'images'],
    });

    return {
      id: commentWithUser.id,
      content: commentWithUser.content,
      createdAt: commentWithUser.createdAt,
      user: {
        id: commentWithUser.user.id,
        name: commentWithUser.user.name,
      },
      images: commentWithUser.images.map((image) => ({
        id: image.id,
        path: image.path,
        url: this.storageService.getPublicUrl(image.path),
      })),
    };
  }
}
