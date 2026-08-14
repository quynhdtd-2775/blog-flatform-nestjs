import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { buildPaginationMeta } from '../../common/pagination.util';
import { FindCategoriesDto } from './dto/find-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
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
}
