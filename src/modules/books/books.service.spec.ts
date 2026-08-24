import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BooksService } from './books.service';
import { Book } from '../../database/entities/book.entity';
import { StorageService } from '../storage/storage.service';

describe('BooksService', () => {
  let service: BooksService;
  let bookRepo: jest.Mocked<Partial<Repository<Book>>>;
  let storageService: {
    save: jest.Mock;
    remove: jest.Mock;
    getPublicUrl: jest.Mock;
  };

  const createMockQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  });

  beforeEach(async () => {
    bookRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    storageService = {
      save: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: getRepositoryToken(Book), useValue: bookRepo },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns paginated books with meta', async () => {
      const qb = createMockQueryBuilder();
      const book = {
        id: 1,
        title: 'Clean Code',
        description: 'desc',
        author: { id: 1, name: 'Robert C. Martin' },
        publisher: { id: 1, name: 'Prentice Hall' },
        category: { id: 1, name: 'Programming' },
        totalQuantity: 10,
        availableQuantity: 7,
      } as Book;

      qb.getManyAndCount.mockResolvedValue([[book], 1]);
      (bookRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 1,
        title: 'Clean Code',
        author: { id: 1, name: 'Robert C. Martin' },
      });
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('applies the keyword filter when provided', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      (bookRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, keyword: 'clean' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'book.title ILIKE :keyword',
        expect.objectContaining({ keyword: '%clean%' }),
      );
    });

    it('applies the author_id filter when provided', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      (bookRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, author_id: 1 });

      expect(qb.andWhere).toHaveBeenCalledWith('author.id = :authorId', {
        authorId: 1,
      });
    });

    it('applies the category_id filter when provided', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      (bookRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, category_id: 1 });

      expect(qb.andWhere).toHaveBeenCalledWith('category.id = :categoryId', {
        categoryId: 1,
      });
    });
  });

  describe('findOne', () => {
    it('returns the serialized book when found', async () => {
      (bookRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        title: 'Clean Code',
        description: 'desc',
        author: { id: 1, name: 'Robert C. Martin' },
        publisher: { id: 1, name: 'Prentice Hall' },
        category: { id: 1, name: 'Programming' },
        totalQuantity: 10,
        availableQuantity: 7,
      } as Book);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.author).toEqual({ id: 1, name: 'Robert C. Martin' });
    });

    it('throws NotFoundException when the book does not exist', async () => {
      (bookRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateCover', () => {
    const file = {
      buffer: Buffer.from('fake'),
      originalname: 'cover.png',
    } as Express.Multer.File;

    it('uploads and persists the cover path, removing the old one', async () => {
      (bookRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        coverPath: 'books/old.png',
      } as Book);
      storageService.save.mockResolvedValue('books/new.png');
      storageService.getPublicUrl.mockReturnValue(
        'http://localhost:3000/uploads/books/new.png',
      );

      const result = await service.updateCover(1, file);

      expect(storageService.remove).toHaveBeenCalledWith('books/old.png');
      expect(bookRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ coverPath: 'books/new.png' }),
      );
      expect(result).toEqual({
        coverPath: 'books/new.png',
        coverUrl: 'http://localhost:3000/uploads/books/new.png',
      });
    });

    it('throws NotFoundException when the book does not exist', async () => {
      (bookRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateCover(999, file)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(storageService.save).not.toHaveBeenCalled();
    });
  });
});
