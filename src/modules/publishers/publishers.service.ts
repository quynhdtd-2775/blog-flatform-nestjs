import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publisher } from '../../database/entities/publisher.entity';
import { Book } from '../../database/entities/book.entity';
import { i18n } from '../../helpers/common';
import { buildPaginationMeta } from '../../common/pagination.util';
import { FindPublishersDto } from './dto/find-publishers.dto';

@Injectable()
export class PublishersService {
  constructor(
    @InjectRepository(Publisher)
    private readonly publisherRepo: Repository<Publisher>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async findAll(query: FindPublishersDto) {
    const { page = 1, limit = 10, keyword } = query;

    const queryBuilder = this.publisherRepo
      .createQueryBuilder('publisher')
      .orderBy('publisher.id', 'DESC');

    if (keyword) {
      queryBuilder.andWhere('publisher.name ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    queryBuilder.take(limit).skip((page - 1) * limit);

    const [publishers, total] = await queryBuilder.getManyAndCount();

    return {
      data: publishers.map((publisher) => ({
        id: publisher.id,
        name: publisher.name,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const publisher = await this.publisherRepo.findOne({ where: { id } });

    if (!publisher) {
      throw new NotFoundException(i18n()?.t('error.publisher.notFound'));
    }

    const books = await this.bookRepo.find({
      where: { publisher: { id } },
      select: { id: true, title: true, availableQuantity: true },
    });

    return {
      id: publisher.id,
      name: publisher.name,
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        availableQuantity: book.availableQuantity,
      })),
    };
  }
}
