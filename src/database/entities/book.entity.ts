import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Author } from './author.entity';
import { Publisher } from './publisher.entity';
import { Category } from './category.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => Author)
  @JoinColumn({ name: 'author_id' })
  author!: Author;

  @ManyToOne(() => Publisher)
  @JoinColumn({ name: 'publisher_id' })
  publisher!: Publisher;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ name: 'total_quantity', type: 'int', default: 0 })
  totalQuantity!: number;

  @Column({ name: 'available_quantity', type: 'int', default: 0 })
  availableQuantity!: number;

  @Column({ name: 'cover_path', type: 'varchar', nullable: true })
  coverPath!: string | null;
}
