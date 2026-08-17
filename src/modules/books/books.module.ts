import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../../database/entities/book.entity';
import { Comment } from '../../database/entities/comment.entity';
import { AuthModule } from '../auth/auth.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Comment]),
    forwardRef(() => AuthModule),
  ],
  controllers: [BooksController],
  providers: [BooksService, CommentsService],
  exports: [BooksService],
})
export class BooksModule {}
