import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../../database/entities/author.entity';
import { Book } from '../../database/entities/book.entity';
import { i18n } from '../../helpers/common';
import { buildPaginationMeta } from '../../common/pagination.util';
import { FindAuthorsDto } from './dto/find-authors.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepo: Repository<Author>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async findAll(query: FindAuthorsDto) {
    const { page = 1, limit = 10, search } = query;

    const queryBuilder = this.authorRepo
      .createQueryBuilder('author')
      .orderBy('author.id', 'DESC');

    if (search) {
      queryBuilder.andWhere('author.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    queryBuilder.take(limit).skip((page - 1) * limit);

    const [authors, total] = await queryBuilder.getManyAndCount();

    return {
      data: authors.map((author) => ({
        id: author.id,
        name: author.name,
        bio: author.bio,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

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
