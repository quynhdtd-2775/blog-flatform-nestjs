import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BorrowRequest } from '../../database/entities/borrow-request.entity';
import { BorrowRequestBook } from '../../database/entities/borrow-request-book.entity';
import { Book } from '../../database/entities/book.entity';
import { AuthModule } from '../auth/auth.module';
import { BorrowRequestsController } from './borrow-requests.controller';
import { BorrowRequestsService } from './borrow-requests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BorrowRequest, BorrowRequestBook, Book]),
    forwardRef(() => AuthModule),
  ],
  controllers: [BorrowRequestsController],
  providers: [BorrowRequestsService],
})
export class BorrowRequestsModule {}
