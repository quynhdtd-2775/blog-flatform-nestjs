import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../../database/entities/book.entity';
import { i18n } from '../../helpers/common';
import { buildPaginationMeta } from '../../common/pagination.util';
import { FindBooksDto } from './dto/find-books.dto';
import { serializeBook } from './book.serializer';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    private readonly storageService: StorageService,
  ) {}

  async findAll(query: FindBooksDto) {
    const { page = 1, limit = 10, keyword, author_id, category_id } = query;

    const queryBuilder = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.publisher', 'publisher')
      .leftJoinAndSelect('book.category', 'category')
      .orderBy('book.id', 'DESC');

    if (keyword) {
      queryBuilder.andWhere('book.title ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    if (author_id) {
      queryBuilder.andWhere('author.id = :authorId', { authorId: author_id });
    }

    if (category_id) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: category_id,
      });
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

  async updateCover(id: number, file: Express.Multer.File) {
    const book = await this.findOneOrThrow(id);

    const key = await this.storageService.save({
      buffer: file.buffer,
      originalName: file.originalname,
      folder: 'books',
    });

    if (book.coverPath) {
      await this.storageService.remove(book.coverPath);
    }

    book.coverPath = key;
    await this.bookRepo.save(book);

    return {
      coverPath: book.coverPath,
      coverUrl: this.storageService.getPublicUrl(book.coverPath),
    };
  }
}
