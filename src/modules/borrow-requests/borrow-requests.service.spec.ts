import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { BorrowRequestsService } from './borrow-requests.service';
import { Book } from '../../database/entities/book.entity';
import {
  BorrowRequest,
  BorrowRequestStatus,
} from '../../database/entities/borrow-request.entity';
import { BorrowRequestBook } from '../../database/entities/borrow-request-book.entity';

describe('BorrowRequestsService', () => {
  let service: BorrowRequestsService;
  let borrowRequestRepo: jest.Mocked<Partial<Repository<BorrowRequest>>> & {
    manager: { transaction: jest.Mock };
  };
  let borrowRequestBookRepo: jest.Mocked<
    Partial<Repository<BorrowRequestBook>>
  >;
  let bookRepo: jest.Mocked<Partial<Repository<Book>>>;

  const createMockQueryBuilder = () => ({
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getManyAndCount: jest.fn(),
  });

  const mockManager = {
    create: jest.fn((_entity: unknown, data: unknown) => data),
    save: jest.fn((_entity: unknown, data: unknown) => Promise.resolve(data)),
  };

  beforeEach(async () => {
    borrowRequestRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        transaction: jest.fn((cb: (manager: unknown) => unknown) =>
          Promise.resolve(cb(mockManager)),
        ),
      },
    } as never;

    borrowRequestBookRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
    };

    bookRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowRequestsService,
        {
          provide: getRepositoryToken(BorrowRequest),
          useValue: borrowRequestRepo,
        },
        {
          provide: getRepositoryToken(BorrowRequestBook),
          useValue: borrowRequestBookRepo,
        },
        { provide: getRepositoryToken(Book), useValue: bookRepo },
      ],
    }).compile();

    service = module.get<BorrowRequestsService>(BorrowRequestsService);
    jest.clearAllMocks();
    mockManager.create.mockImplementation(
      (_entity: unknown, data: unknown) => data,
    );
    mockManager.save.mockImplementation((_entity: unknown, data: unknown) =>
      Promise.resolve(data),
    );
    (borrowRequestRepo.manager.transaction as jest.Mock).mockImplementation(
      (cb: (manager: unknown) => unknown) => Promise.resolve(cb(mockManager)),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const baseDto = {
      fromDate: '2026-08-10',
      toDate: '2026-08-17',
      books: [{ bookId: 1, quantity: 2 }],
    };

    it('rejects an invalid date range (fromDate >= toDate)', async () => {
      await expect(
        service.create(1, {
          ...baseDto,
          fromDate: '2026-08-17',
          toDate: '2026-08-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(bookRepo.find).not.toHaveBeenCalled();
    });

    it('rejects when a requested book does not exist', async () => {
      (bookRepo.find as jest.Mock).mockResolvedValue([]);

      await expect(service.create(1, baseDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when requested quantity exceeds availability for the overlapping period', async () => {
      (bookRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, totalQuantity: 5 } as Book,
      ]);

      const availabilityQb = createMockQueryBuilder();
      availabilityQb.getRawMany.mockResolvedValue([
        { bookId: 1, reserved: '4' },
      ]);
      (borrowRequestBookRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        availabilityQb,
      );

      await expect(
        service.create(1, { ...baseDto, books: [{ bookId: 1, quantity: 2 }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a PENDING request with all books when availability allows it', async () => {
      (bookRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, totalQuantity: 5 } as Book,
        { id: 2, totalQuantity: 3 } as Book,
      ]);

      const availabilityQb = createMockQueryBuilder();
      availabilityQb.getRawMany.mockResolvedValue([]);
      (borrowRequestBookRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        availabilityQb,
      );

      mockManager.save.mockImplementationOnce(
        (_entity: unknown, data: unknown) =>
          Promise.resolve({ ...(data as object), id: 100 }),
      );

      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
        id: 100,
        fromDate: baseDto.fromDate,
        toDate: baseDto.toDate,
        status: BorrowRequestStatus.PENDING,
        rejectReason: null,
        user: { id: 1 },
      });
      (borrowRequestBookRepo.find as jest.Mock).mockResolvedValue([
        { book: { id: 1, title: 'Clean Code' }, quantity: 1 },
        { book: { id: 2, title: 'Refactoring' }, quantity: 2 },
      ]);

      const dto = {
        ...baseDto,
        books: [
          { bookId: 1, quantity: 1 },
          { bookId: 2, quantity: 2 },
        ],
      };

      const result = await service.create(1, dto);

      expect(result.status).toBe(BorrowRequestStatus.PENDING);
      expect(result.books).toHaveLength(2);
      expect(borrowRequestRepo.manager.transaction).toHaveBeenCalledTimes(1);
    });

    it('only counts PENDING/APPROVED requests as active reservations (never CANCELLED/REJECTED)', async () => {
      (bookRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, totalQuantity: 5 } as Book,
      ]);

      const availabilityQb = createMockQueryBuilder();
      availabilityQb.getRawMany.mockResolvedValue([]);
      (borrowRequestBookRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        availabilityQb,
      );

      mockManager.save.mockImplementationOnce(
        (_entity: unknown, data: unknown) =>
          Promise.resolve({ ...(data as object), id: 101 }),
      );
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
        id: 101,
        fromDate: baseDto.fromDate,
        toDate: baseDto.toDate,
        status: BorrowRequestStatus.PENDING,
        rejectReason: null,
        user: { id: 1 },
      });
      (borrowRequestBookRepo.find as jest.Mock).mockResolvedValue([]);

      await service.create(1, {
        ...baseDto,
        books: [{ bookId: 1, quantity: 5 }],
      });

      expect(availabilityQb.andWhere).toHaveBeenCalledWith(
        'br.status IN (:...statuses)',
        {
          statuses: [BorrowRequestStatus.PENDING, BorrowRequestStatus.APPROVED],
        },
      );
    });
  });

  describe('findHistory', () => {
    it('scopes results to the given userId and returns pagination meta', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([
        [
          {
            id: 100,
            fromDate: '2026-08-10',
            toDate: '2026-08-17',
            status: BorrowRequestStatus.PENDING,
            rejectReason: null,
          },
        ],
        1,
      ]);
      (borrowRequestRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (borrowRequestBookRepo.find as jest.Mock).mockResolvedValue([
        {
          borrowRequest: { id: 100 },
          book: { id: 1, title: 'Clean Code' },
          quantity: 1,
        },
      ]);

      const result = await service.findHistory(42, { page: 1, limit: 10 });

      expect(qb.where).toHaveBeenCalledWith('br.user_id = :userId', {
        userId: 42,
      });
      expect(result.data[0].books).toEqual([
        { id: 1, title: 'Clean Code', quantity: 1 },
      ]);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('cancel', () => {
    it('cancels the caller own PENDING request', async () => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        status: BorrowRequestStatus.PENDING,
        user: { id: 1 },
      });
      (borrowRequestRepo.save as jest.Mock).mockImplementation(
        (entity: unknown) => Promise.resolve(entity),
      );

      const result = await service.cancel(1, 1);

      expect(result).toEqual({ id: 1, status: BorrowRequestStatus.CANCELLED });
    });

    it('throws NotFoundException when the request does not exist', async () => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.cancel(1, 999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when cancelling another user request', async () => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        status: BorrowRequestStatus.PENDING,
        user: { id: 2 },
      });

      await expect(service.cancel(1, 1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it.each([
      BorrowRequestStatus.APPROVED,
      BorrowRequestStatus.REJECTED,
      BorrowRequestStatus.CANCELLED,
    ])('rejects cancelling a request that is already %s', async (status) => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        status,
        user: { id: 1 },
      });

      await expect(service.cancel(1, 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
