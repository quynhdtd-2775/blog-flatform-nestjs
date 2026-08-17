import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublishersService } from './publishers.service';
import { Publisher } from '../../database/entities/publisher.entity';

describe('PublishersService', () => {
  let service: PublishersService;
  let publisherRepo: jest.Mocked<Partial<Repository<Publisher>>>;

  const createMockQueryBuilder = () => ({
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  });

  beforeEach(async () => {
    publisherRepo = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishersService,
        { provide: getRepositoryToken(Publisher), useValue: publisherRepo },
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
});
