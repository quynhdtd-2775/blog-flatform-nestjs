import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PublishersService } from './publishers.service';
import { Publisher } from '../../database/entities/publisher.entity';
import { Book } from '../../database/entities/book.entity';

describe('PublishersService', () => {
  let service: PublishersService;
  let publisherRepo: jest.Mocked<Partial<Repository<Publisher>>>;
  let bookRepo: jest.Mocked<Partial<Repository<Book>>>;

  const createMockQueryBuilder = () => ({
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  });

  beforeEach(async () => {
    publisherRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
    bookRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishersService,
        { provide: getRepositoryToken(Publisher), useValue: publisherRepo },
        { provide: getRepositoryToken(Book), useValue: bookRepo },
      ],
    }).compile();

    service = module.get<PublishersService>(PublishersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns paginated publishers with meta', async () => {
    const qb = createMockQueryBuilder();
    qb.getManyAndCount.mockResolvedValue([
      [{ id: 1, name: 'Prentice Hall' }],
      1,
    ]);
    (publisherRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.data).toEqual([{ id: 1, name: 'Prentice Hall' }]);
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
    (publisherRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    await service.findAll({ page: 1, limit: 10, keyword: 'prentice' });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'publisher.name ILIKE :keyword',
      expect.objectContaining({ keyword: '%prentice%' }),
    );
  });

  it('returns the publisher with its books', async () => {
    (publisherRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Prentice Hall',
    } as Publisher);
    (bookRepo.find as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Clean Code', availableQuantity: 7 },
    ]);

    const result = await service.findOne(1);

    expect(result).toEqual({
      id: 1,
      name: 'Prentice Hall',
      books: [{ id: 1, title: 'Clean Code', availableQuantity: 7 }],
    });
  });

  it('throws NotFoundException when the publisher does not exist', async () => {
    (publisherRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(bookRepo.find).not.toHaveBeenCalled();
  });
});
