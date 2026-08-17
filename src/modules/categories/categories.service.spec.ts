import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from '../../database/entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: jest.Mocked<Partial<Repository<Category>>>;

  const createMockQueryBuilder = () => ({
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  });

  beforeEach(async () => {
    categoryRepo = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns paginated categories with meta', async () => {
    const qb = createMockQueryBuilder();
    qb.getManyAndCount.mockResolvedValue([[{ id: 1, name: 'Programming' }], 1]);
    (categoryRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.data).toEqual([{ id: 1, name: 'Programming' }]);
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
    (categoryRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    await service.findAll({ page: 1, limit: 10, keyword: 'prog' });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'category.name ILIKE :keyword',
      expect.objectContaining({ keyword: '%prog%' }),
    );
  });
});
