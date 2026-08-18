import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { SeedService } from './seed.service';
import { Author } from 'src/database/entities/author.entity';
import { Category } from 'src/database/entities/category.entity';
import { Publisher } from 'src/database/entities/publisher.entity';
import { Book } from 'src/database/entities/book.entity';
import { Comment } from 'src/database/entities/comment.entity';
import { BorrowRequest } from 'src/database/entities/borrow-request.entity';
import { BorrowRequestBook } from 'src/database/entities/borrow-request-book.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      Author,
      Category,
      Publisher,
      Book,
      Comment,
      BorrowRequest,
      BorrowRequestBook,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
