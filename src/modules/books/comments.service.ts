import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

    const keys = await Promise.all(
      files.map((file) =>
        this.storageService.save({
          buffer: file.buffer,
          originalName: file.originalname,
          folder: 'comments',
        }),
      ),
    );

    try {
      const commentWithUser = await this.commentRepo.manager.transaction(
        async (manager: EntityManager) => {
          const comment = await manager.save(
            manager.create(Comment, {
              book: { id: bookId },
              user: { id: userId },
              content: dto.content,
            }),
          );

          if (keys.length > 0) {
            await manager.save(
              keys.map((key) =>
                manager.create(CommentImage, { comment, path: key }),
              ),
            );
          }

          return manager.findOneOrFail(Comment, {
            where: { id: comment.id },
            relations: ['user', 'images'],
          });
        },
      );

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
    } catch (error) {
      await Promise.all(keys.map((key) => this.storageService.remove(key)));
      throw error;
    }
  }
}
