import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { BorrowRequestsService } from './borrow-requests.service';
import { Book } from '../../database/entities/book.entity';
import {
  BorrowRequest,
  BorrowRequestStatus,
} from '../../database/entities/borrow-request.entity';
import { BorrowRequestBook } from '../../database/entities/borrow-request-book.entity';
import { EVENT_NAMES } from '../../common/events/event-names';
import { BorrowRequestApprovedEvent } from '../../common/events/borrow-request-approved.event';
import { BorrowRequestRejectedEvent } from '../../common/events/borrow-request-rejected.event';

describe('BorrowRequestsService', () => {
  let service: BorrowRequestsService;
  let borrowRequestRepo: jest.Mocked<Partial<Repository<BorrowRequest>>> & {
    manager: { transaction: jest.Mock };
  };
  let borrowRequestBookRepo: jest.Mocked<
    Partial<Repository<BorrowRequestBook>>
  >;
  let bookRepo: jest.Mocked<Partial<Repository<Book>>>;
  let eventEmitter: { emit: jest.Mock };

  const createMockQueryBuilder = () => ({
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
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
    decrement: jest.fn(() => Promise.resolve()),
    findOne: jest.fn(),
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

    eventEmitter = { emit: jest.fn() };

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
        { provide: EventEmitter2, useValue: eventEmitter },
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
    mockManager.decrement.mockImplementation(() => Promise.resolve());
    mockManager.findOne.mockImplementation(() => Promise.resolve(undefined));
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

    it('creates a NEW request with all books when availability allows it', async () => {
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
        status: BorrowRequestStatus.NEW,
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

      expect(result.status).toBe(BorrowRequestStatus.NEW);
      expect(result.books).toHaveLength(2);
      expect(borrowRequestRepo.manager.transaction).toHaveBeenCalledTimes(1);
    });

    it('only counts NEW/PENDING/APPROVED requests as active reservations (never CANCELLED/REJECTED)', async () => {
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
        status: BorrowRequestStatus.NEW,
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
          statuses: [
            BorrowRequestStatus.NEW,
            BorrowRequestStatus.PENDING,
            BorrowRequestStatus.APPROVED,
          ],
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
    it.each([BorrowRequestStatus.NEW, BorrowRequestStatus.PENDING])(
      'cancels the caller own %s request',
      async (status) => {
        (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
          id: 1,
          status,
          user: { id: 1 },
        });
        (borrowRequestRepo.save as jest.Mock).mockImplementation(
          (entity: unknown) => Promise.resolve(entity),
        );

        const result = await service.cancel(1, 1);

        expect(result).toEqual({
          id: 1,
          status: BorrowRequestStatus.CANCELLED,
        });
      },
    );

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

  describe('findAllForAdmin', () => {
    it('returns all requests across users with pagination meta', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([
        [
          {
            id: 1,
            fromDate: '2026-08-10',
            toDate: '2026-08-17',
            status: BorrowRequestStatus.NEW,
            rejectReason: null,
            user: { id: 5, name: 'Jane Doe', email: 'jane@example.com' },
          },
        ],
        1,
      ]);
      (borrowRequestRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (borrowRequestBookRepo.find as jest.Mock).mockResolvedValue([
        {
          borrowRequest: { id: 1 },
          book: { id: 1, title: 'Clean Code' },
          quantity: 1,
        },
      ]);

      const result = await service.findAllForAdmin({ page: 1, limit: 10 });

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('br.user', 'user');
      expect(result.data[0].user).toEqual({
        id: 5,
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('filters by status and userId when provided', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      (borrowRequestRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAllForAdmin({
        page: 1,
        limit: 10,
        status: BorrowRequestStatus.PENDING,
        userId: 7,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('br.status = :status', {
        status: BorrowRequestStatus.PENDING,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('br.user_id = :userId', {
        userId: 7,
      });
    });
  });

  describe('findOneForAdmin', () => {
    it('returns any request regardless of owner', async () => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        fromDate: '2026-08-10',
        toDate: '2026-08-17',
        status: BorrowRequestStatus.NEW,
        rejectReason: null,
        user: { id: 5, name: 'Jane Doe', email: 'jane@example.com' },
      });
      (borrowRequestBookRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findOneForAdmin(1);

      expect(result.user.email).toBe('jane@example.com');
    });

    it('throws NotFoundException when the request does not exist', async () => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneForAdmin(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it.each([BorrowRequestStatus.NEW, BorrowRequestStatus.PENDING])(
      'approves a %s request, decrements book availability, and emits BorrowRequestApproved to the owner',
      async (status) => {
        (borrowRequestRepo.findOne as jest.Mock)
          .mockResolvedValueOnce({ id: 1, status })
          .mockResolvedValueOnce({
            id: 1,
            fromDate: '2026-08-10',
            toDate: '2026-08-17',
            status: BorrowRequestStatus.APPROVED,
            rejectReason: null,
            user: { id: 5, name: 'Jane Doe', email: 'jane@example.com' },
          });
        (borrowRequestBookRepo.find as jest.Mock)
          .mockResolvedValueOnce([
            { book: { id: 1 }, quantity: 2 },
            { book: { id: 2 }, quantity: 1 },
          ])
          .mockResolvedValueOnce([
            { book: { id: 1, title: 'Clean Code' }, quantity: 2 },
          ]);
        mockManager.findOne.mockImplementation(
          (_entity: unknown, options: { where: { id: number } }) =>
            Promise.resolve({
              id: options.where.id,
              availableQuantity: 5,
            }),
        );

        const result = await service.approve(1);

        expect(result.status).toBe(BorrowRequestStatus.APPROVED);
        expect(mockManager.decrement).toHaveBeenCalledWith(
          Book,
          { id: 1 },
          'availableQuantity',
          2,
        );
        expect(mockManager.decrement).toHaveBeenCalledWith(
          Book,
          { id: 2 },
          'availableQuantity',
          1,
        );
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          EVENT_NAMES.BORROW_REQUEST_APPROVED,
          new BorrowRequestApprovedEvent(
            1,
            5,
            'jane@example.com',
            'Jane Doe',
            '2026-08-10',
            '2026-08-17',
            [{ title: 'Clean Code', quantity: 2 }],
          ),
        );
      },
    );

    it('throws NotFoundException when the request does not exist', async () => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.approve(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it.each([
      BorrowRequestStatus.APPROVED,
      BorrowRequestStatus.REJECTED,
      BorrowRequestStatus.CANCELLED,
    ])('rejects approving a request that is already %s', async (status) => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        status,
      });

      await expect(service.approve(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('rolls back and does not emit when available_quantity is insufficient', async () => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValueOnce({
        id: 1,
        status: BorrowRequestStatus.PENDING,
      });
      (borrowRequestBookRepo.find as jest.Mock).mockResolvedValueOnce([
        { book: { id: 1 }, quantity: 3 },
      ]);
      mockManager.findOne.mockResolvedValueOnce({
        id: 1,
        availableQuantity: 2,
      });

      await expect(service.approve(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockManager.decrement).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it.each([BorrowRequestStatus.NEW, BorrowRequestStatus.PENDING])(
      'rejects a %s request with the given reason',
      async (status) => {
        const request = { id: 1, status, rejectReason: null };
        (borrowRequestRepo.findOne as jest.Mock)
          .mockResolvedValueOnce(request)
          .mockResolvedValueOnce({
            id: 1,
            fromDate: '2026-08-10',
            toDate: '2026-08-17',
            status: BorrowRequestStatus.REJECTED,
            rejectReason: 'Not available',
            user: { id: 5, name: 'Jane Doe', email: 'jane@example.com' },
          });
        (borrowRequestRepo.save as jest.Mock).mockImplementation(
          (entity: unknown) => Promise.resolve(entity),
        );
        (borrowRequestBookRepo.find as jest.Mock).mockResolvedValue([]);

        const result = await service.reject(1, 'Not available');

        expect(request.status).toBe(BorrowRequestStatus.REJECTED);
        expect(request.rejectReason).toBe('Not available');
        expect(result.rejectReason).toBe('Not available');
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          EVENT_NAMES.BORROW_REQUEST_REJECTED,
          new BorrowRequestRejectedEvent(
            1,
            5,
            'jane@example.com',
            'Jane Doe',
            '2026-08-10',
            '2026-08-17',
            'Not available',
          ),
        );
      },
    );

    it('throws NotFoundException when the request does not exist', async () => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.reject(999, 'reason')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it.each([
      BorrowRequestStatus.APPROVED,
      BorrowRequestStatus.REJECTED,
      BorrowRequestStatus.CANCELLED,
    ])('rejects reviewing a request that is already %s', async (status) => {
      (borrowRequestRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        status,
      });

      await expect(service.reject(1, 'reason')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('does not decrease book availability', async () => {
      const request = { id: 1, status: BorrowRequestStatus.PENDING };
      (borrowRequestRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(request)
        .mockResolvedValueOnce({
          id: 1,
          fromDate: '2026-08-10',
          toDate: '2026-08-17',
          status: BorrowRequestStatus.REJECTED,
          rejectReason: 'reason',
          user: { id: 5, name: 'Jane Doe', email: 'jane@example.com' },
        });
      (borrowRequestRepo.save as jest.Mock).mockImplementation(
        (entity: unknown) => Promise.resolve(entity),
      );
      (borrowRequestBookRepo.find as jest.Mock).mockResolvedValue([]);

      await service.reject(1, 'reason');

      expect(mockManager.decrement).not.toHaveBeenCalled();
      expect(borrowRequestRepo.manager.transaction).not.toHaveBeenCalled();
    });
  });
});
