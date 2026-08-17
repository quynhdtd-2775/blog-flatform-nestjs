import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publisher } from '../../database/entities/publisher.entity';
import { buildPaginationMeta } from '../../common/pagination.util';
import { FindPublishersDto } from './dto/find-publishers.dto';

@Injectable()
export class PublishersService {
  constructor(
    @InjectRepository(Publisher)
    private readonly publisherRepo: Repository<Publisher>,
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
}
