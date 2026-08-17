import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthorsService } from './authors.service';
import { Author } from '../../database/entities/author.entity';
import { Book } from '../../database/entities/book.entity';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let authorRepo: jest.Mocked<Partial<Repository<Author>>>;
  let bookRepo: jest.Mocked<Partial<Repository<Book>>>;

  const createMockQueryBuilder = () => ({
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  });

  beforeEach(async () => {
    authorRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
    bookRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        { provide: getRepositoryToken(Author), useValue: authorRepo },
        { provide: getRepositoryToken(Book), useValue: bookRepo },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns paginated authors with meta', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([
        [{ id: 1, name: 'Robert C. Martin', bio: 'Author of Clean Code' }],
        1,
      ]);
      (authorRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([
        { id: 1, name: 'Robert C. Martin', bio: 'Author of Clean Code' },
      ]);
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
      (authorRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, keyword: 'martin' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'author.name ILIKE :keyword',
        expect.objectContaining({ keyword: '%martin%' }),
      );
    });
  });

  it('returns the author with their books', async () => {
    (authorRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Robert C. Martin',
      bio: 'Author of Clean Code',
    } as Author);
    (bookRepo.find as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Clean Code', availableQuantity: 7 },
    ]);

    const result = await service.findOne(1);

    expect(result).toEqual({
      id: 1,
      name: 'Robert C. Martin',
      bio: 'Author of Clean Code',
      books: [{ id: 1, title: 'Clean Code', availableQuantity: 7 }],
    });
  });

  it('throws NotFoundException when the author does not exist', async () => {
    (authorRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(bookRepo.find).not.toHaveBeenCalled();
  });
});
