import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from './comment.entity';

@Entity('comment_images')
export class CommentImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment!: Comment;

  @Column()
  path!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
