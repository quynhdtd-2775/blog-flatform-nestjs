import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BorrowRequestBook } from './borrow-request-book.entity';

export enum BorrowRequestStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('borrow_requests')
export class BorrowRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'from_date', type: 'date' })
  fromDate: string;

  @Column({ name: 'to_date', type: 'date' })
  toDate: string;

  @Column({ type: 'varchar', default: BorrowRequestStatus.PENDING })
  status: BorrowRequestStatus;

  @Column({ name: 'reject_reason', type: 'varchar', nullable: true })
  rejectReason: string | null;

  @OneToMany(() => BorrowRequestBook, (item) => item.borrowRequest, {
    cascade: true,
  })
  books: BorrowRequestBook[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
