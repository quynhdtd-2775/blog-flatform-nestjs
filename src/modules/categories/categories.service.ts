import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { Book } from '../../database/entities/book.entity';
import { i18n } from '../../helpers/common';
import { buildPaginationMeta } from '../../common/pagination.util';
import { FindCategoriesDto } from './dto/find-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async findAll(query: FindCategoriesDto) {
    const { page = 1, limit = 10, keyword } = query;

    const queryBuilder = this.categoryRepo
      .createQueryBuilder('category')
      .orderBy('category.id', 'DESC');

    if (keyword) {
      queryBuilder.andWhere('category.name ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    queryBuilder.take(limit).skip((page - 1) * limit);

    const [categories, total] = await queryBuilder.getManyAndCount();

    return {
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(i18n()?.t('error.category.notFound'));
    }

    const books = await this.bookRepo.find({
      where: { category: { id } },
      select: { id: true, title: true, availableQuantity: true },
    });

    return {
      id: category.id,
      name: category.name,
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        availableQuantity: book.availableQuantity,
      })),
    };
  }
}
