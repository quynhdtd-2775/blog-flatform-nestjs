import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BorrowRequest } from './borrow-request.entity';
import { Book } from './book.entity';

@Entity('borrow_request_books')
export class BorrowRequestBook {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BorrowRequest, (request) => request.books, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'borrow_request_id' })
  borrowRequest: BorrowRequest;

  @ManyToOne(() => Book)
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ type: 'int', default: 1 })
  quantity: number;
}
