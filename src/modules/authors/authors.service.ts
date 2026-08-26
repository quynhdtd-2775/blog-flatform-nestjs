import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../../database/entities/author.entity';
import { Book } from '../../database/entities/book.entity';
import { i18n } from '../../helpers/common';
import { buildPaginationMeta } from '../../common/pagination.util';
import { FindAuthorsDto } from './dto/find-authors.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepo: Repository<Author>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    private readonly storageService: StorageService,
  ) {}

  async findAll(query: FindAuthorsDto) {
    const { page = 1, limit = 10, keyword } = query;

    const queryBuilder = this.authorRepo
      .createQueryBuilder('author')
      .orderBy('author.id', 'DESC');

    if (keyword) {
      queryBuilder.andWhere('author.name ILIKE :keyword', {
        keyword: `%${keyword}%`,
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
      avatarPath: author.avatarPath,
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        availableQuantity: book.availableQuantity,
      })),
    };
  }

  async updateAvatar(id: number, file: Express.Multer.File) {
    const author = await this.authorRepo.findOne({ where: { id } });

    if (!author) {
      throw new NotFoundException(i18n()?.t('error.author.notFound'));
    }

    const key = await this.storageService.save({
      buffer: file.buffer,
      originalName: file.originalname,
      folder: 'authors',
    });

    const oldAvatarPath = author.avatarPath;
    author.avatarPath = key;
    await this.authorRepo.save(author);

    if (oldAvatarPath) {
      await this.storageService.remove(oldAvatarPath);
    }

    return {
      avatarPath: author.avatarPath,
      avatarUrl: this.storageService.getPublicUrl(author.avatarPath),
    };
  }
}
