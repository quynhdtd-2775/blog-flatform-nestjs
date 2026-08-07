import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../../database/entities/book.entity';
import { i18n } from '../../helpers/common';
import { buildPaginationMeta } from '../../common/pagination.util';
import { FindBooksDto } from './dto/find-books.dto';
import { serializeBook } from './book.serializer';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async findAll(query: FindBooksDto) {
    const { page = 1, limit = 10, search, authorId, categoryId } = query;

    const queryBuilder = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.publisher', 'publisher')
      .leftJoinAndSelect('book.category', 'category')
      .orderBy('book.id', 'DESC');

    if (search) {
      queryBuilder.andWhere('book.title ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (authorId) {
      queryBuilder.andWhere('author.id = :authorId', { authorId });
    }

    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }

    queryBuilder.take(limit).skip((page - 1) * limit);

    const [books, total] = await queryBuilder.getManyAndCount();

    return {
      data: books.map(serializeBook),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOneOrThrow(id: number): Promise<Book> {
    const book = await this.bookRepo.findOne({
      where: { id },
      relations: ['author', 'publisher', 'category'],
    });

    if (!book) {
      throw new NotFoundException(i18n()?.t('error.book.notFound'));
    }

    return book;
  }

  async findOne(id: number) {
    const book = await this.findOneOrThrow(id);
    return serializeBook(book);
  }
}
