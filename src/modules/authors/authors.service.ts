import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../../database/entities/author.entity';
import { Book } from '../../database/entities/book.entity';
import { i18n } from '../../helpers/common';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepo: Repository<Author>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async findOne(id: number) {
    const author = await this.authorRepo.findOne({ where: { id } });

    if (!author) {
      throw new NotFoundException(i18n()?.t('error.author.notFound'));
    }

    const books = await this.bookRepo.find({
      where: { author: { id } },
      select: { id: true, title: true, availableQuantity: true },
    });

    return {
      id: author.id,
      name: author.name,
      bio: author.bio,
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        availableQuantity: book.availableQuantity,
      })),
    };
  }
}
