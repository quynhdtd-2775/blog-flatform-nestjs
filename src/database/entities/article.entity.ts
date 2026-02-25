import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  articleId: number;

  @Index({ unique: true })
  @Column()
  slug: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  body: string;

  @Column('simple-array', { nullable: true })
  tagList?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  favorited: boolean;

  @Column({ default: 0 })
  favoritesCount: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'id' })
  author: User;
}
