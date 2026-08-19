import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Book } from '../../database/entities/book.entity';
import {
  BorrowRequest,
  BorrowRequestStatus,
} from '../../database/entities/borrow-request.entity';
import { BorrowRequestBook } from '../../database/entities/borrow-request-book.entity';
import { i18n } from '../../helpers/common';
import { buildPaginationMeta } from '../../common/pagination.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { AdminFindBorrowRequestsDto } from './dto/admin-find-borrow-requests.dto';
import { EVENT_NAMES } from '../../common/events/event-names';
import { BorrowRequestApprovedEvent } from '../../common/events/borrow-request-approved.event';
import { BorrowRequestRejectedEvent } from '../../common/events/borrow-request-rejected.event';

const ACTIVE_RESERVATION_STATUSES = [
  BorrowRequestStatus.NEW,
  BorrowRequestStatus.PENDING,
  BorrowRequestStatus.APPROVED,
];

const CANCELLABLE_STATUSES = [
  BorrowRequestStatus.NEW,
  BorrowRequestStatus.PENDING,
];

const REVIEWABLE_STATUSES = [
  BorrowRequestStatus.NEW,
  BorrowRequestStatus.PENDING,
];

export interface BorrowRequestBookView {
  id: number;
  title: string;
  quantity: number;
}

export interface BorrowRequestView {
  id: number;
  fromDate: string;
  toDate: string;
  status: BorrowRequestStatus;
  rejectReason: string | null;
  books: BorrowRequestBookView[];
}

export interface BorrowRequestAdminView extends BorrowRequestView {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

@Injectable()
export class BorrowRequestsService {
  constructor(
    @InjectRepository(BorrowRequest)
    private readonly borrowRequestRepo: Repository<BorrowRequest>,
    @InjectRepository(BorrowRequestBook)
    private readonly borrowRequestBookRepo: Repository<BorrowRequestBook>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    userId: number,
    dto: CreateBorrowRequestDto,
  ): Promise<BorrowRequestView> {
    const bookIds = dto.books.map((item) => item.bookId);
    const books = await this.bookRepo.find({ where: { id: In(bookIds) } });

    if (books.length !== new Set(bookIds).size) {
      throw new BadRequestException(
        i18n()?.t('error.borrowRequest.bookNotFound'),
      );
    }

    const booksById = new Map(books.map((book) => [book.id, book]));

    await this.assertAvailability(
      dto.books,
      booksById,
      dto.fromDate,
      dto.toDate,
    );

    const savedRequest = await this.borrowRequestRepo.manager.transaction(
      async (manager) => {
        const borrowRequest = manager.create(BorrowRequest, {
          user: { id: userId },
          fromDate: dto.fromDate,
          toDate: dto.toDate,
          status: BorrowRequestStatus.NEW,
        });

        const saved = await manager.save(BorrowRequest, borrowRequest);

        const borrowRequestBooks = dto.books.map((item) =>
          manager.create(BorrowRequestBook, {
            borrowRequest: { id: saved.id },
            book: { id: item.bookId },
            quantity: item.quantity,
          }),
        );

        await manager.save(BorrowRequestBook, borrowRequestBooks);

        return saved;
      },
    );

    return this.findOneOrThrow(userId, savedRequest.id);
  }

  private async assertAvailability(
    requestedBooks: { bookId: number; quantity: number }[],
    booksById: Map<number, Book>,
    fromDate: string,
    toDate: string,
  ) {
    const bookIds = requestedBooks.map((item) => item.bookId);

    const reservedRows: { bookId: number; reserved: string }[] =
      await this.borrowRequestBookRepo
        .createQueryBuilder('brb')
        .innerJoin('brb.borrowRequest', 'br')
        .select('brb.book_id', 'bookId')
        .addSelect('SUM(brb.quantity)', 'reserved')
        .where('brb.book_id IN (:...bookIds)', { bookIds })
        .andWhere('br.status IN (:...statuses)', {
          statuses: ACTIVE_RESERVATION_STATUSES,
        })
        .andWhere('br.from_date <= :toDate', { toDate })
        .andWhere('br.to_date >= :fromDate', { fromDate })
        .groupBy('brb.book_id')
        .getRawMany();

    const reservedByBookId = new Map(
      reservedRows.map((row) => [Number(row.bookId), Number(row.reserved)]),
    );

    for (const item of requestedBooks) {
      const book = booksById.get(item.bookId);

      if (!book) {
        continue;
      }

      const reserved = reservedByBookId.get(item.bookId) ?? 0;
      const available = book.totalQuantity - reserved;

      if (available < item.quantity) {
        throw new BadRequestException(
          i18n()?.t('error.borrowRequest.notAvailable'),
        );
      }
    }
  }

  async findHistory(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<{
    data: BorrowRequestView[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page = 1, limit = 10 } = query;

    const [requests, total] = await this.borrowRequestRepo
      .createQueryBuilder('br')
      .where('br.user_id = :userId', { userId })
      .orderBy('br.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const requestIds = requests.map((request) => request.id);

    const items = requestIds.length
      ? await this.borrowRequestBookRepo.find({
          where: { borrowRequest: { id: In(requestIds) } },
          relations: ['book', 'borrowRequest'],
        })
      : [];

    const booksByRequestId = new Map<
      number,
      { id: number; title: string; quantity: number }[]
    >();

    for (const item of items) {
      const list = booksByRequestId.get(item.borrowRequest.id) ?? [];
      list.push({
        id: item.book.id,
        title: item.book.title,
        quantity: item.quantity,
      });
      booksByRequestId.set(item.borrowRequest.id, list);
    }

    return {
      data: requests.map((request) => ({
        id: request.id,
        fromDate: request.fromDate,
        toDate: request.toDate,
        status: request.status,
        rejectReason: request.rejectReason,
        books: booksByRequestId.get(request.id) ?? [],
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  private async findOneOrThrow(
    userId: number,
    id: number,
  ): Promise<BorrowRequestView> {
    const request = await this.borrowRequestRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!request || request.user.id !== userId) {
      throw new NotFoundException(i18n()?.t('error.borrowRequest.notFound'));
    }

    const items = await this.borrowRequestBookRepo.find({
      where: { borrowRequest: { id } },
      relations: ['book'],
    });

    return {
      id: request.id,
      fromDate: request.fromDate,
      toDate: request.toDate,
      status: request.status,
      rejectReason: request.rejectReason,
      books: items.map((item) => ({
        id: item.book.id,
        title: item.book.title,
        quantity: item.quantity,
      })),
    };
  }

  async cancel(userId: number, id: number) {
    const request = await this.borrowRequestRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException(i18n()?.t('error.borrowRequest.notFound'));
    }

    if (request.user.id !== userId) {
      throw new ForbiddenException(i18n()?.t('error.borrowRequest.forbidden'));
    }

    if (!CANCELLABLE_STATUSES.includes(request.status)) {
      throw new BadRequestException(
        i18n()?.t('error.borrowRequest.onlyPendingCancellable'),
      );
    }

    request.status = BorrowRequestStatus.CANCELLED;
    const saved = await this.borrowRequestRepo.save(request);

    return {
      id: saved.id,
      status: saved.status,
    };
  }

  async findAllForAdmin(query: AdminFindBorrowRequestsDto): Promise<{
    data: BorrowRequestAdminView[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page = 1, limit = 10, status, userId } = query;

    const queryBuilder = this.borrowRequestRepo
      .createQueryBuilder('br')
      .leftJoinAndSelect('br.user', 'user')
      .orderBy('br.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('br.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('br.user_id = :userId', { userId });
    }

    const [requests, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const requestIds = requests.map((request) => request.id);

    const items = requestIds.length
      ? await this.borrowRequestBookRepo.find({
          where: { borrowRequest: { id: In(requestIds) } },
          relations: ['book', 'borrowRequest'],
        })
      : [];

    const booksByRequestId = new Map<number, BorrowRequestBookView[]>();

    for (const item of items) {
      const list = booksByRequestId.get(item.borrowRequest.id) ?? [];
      list.push({
        id: item.book.id,
        title: item.book.title,
        quantity: item.quantity,
      });
      booksByRequestId.set(item.borrowRequest.id, list);
    }

    return {
      data: requests.map((request) => ({
        id: request.id,
        fromDate: request.fromDate,
        toDate: request.toDate,
        status: request.status,
        rejectReason: request.rejectReason,
        books: booksByRequestId.get(request.id) ?? [],
        user: {
          id: request.user.id,
          name: request.user.name,
          email: request.user.email,
        },
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOneForAdmin(id: number): Promise<BorrowRequestAdminView> {
    const request = await this.borrowRequestRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException(i18n()?.t('error.borrowRequest.notFound'));
    }

    const items = await this.borrowRequestBookRepo.find({
      where: { borrowRequest: { id } },
      relations: ['book'],
    });

    return {
      id: request.id,
      fromDate: request.fromDate,
      toDate: request.toDate,
      status: request.status,
      rejectReason: request.rejectReason,
      books: items.map((item) => ({
        id: item.book.id,
        title: item.book.title,
        quantity: item.quantity,
      })),
      user: {
        id: request.user.id,
        name: request.user.name,
        email: request.user.email,
      },
    };
  }

  async approve(id: number): Promise<BorrowRequestAdminView> {
    const request = await this.loadReviewableRequestOrThrow(id);

    const items = await this.borrowRequestBookRepo.find({
      where: { borrowRequest: { id } },
      relations: ['book'],
    });

    await this.borrowRequestRepo.manager.transaction(async (manager) => {
      for (const item of items) {
        const book = await manager.findOne(Book, {
          where: { id: item.book.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!book || book.availableQuantity < item.quantity) {
          throw new BadRequestException(
            i18n()?.t('error.borrowRequest.notAvailable'),
          );
        }
      }

      request.status = BorrowRequestStatus.APPROVED;
      await manager.save(BorrowRequest, request);

      for (const item of items) {
        await manager.decrement(
          Book,
          { id: item.book.id },
          'availableQuantity',
          item.quantity,
        );
      }
    });

    const view = await this.findOneForAdmin(id);

    this.eventEmitter.emit(
      EVENT_NAMES.BORROW_REQUEST_APPROVED,
      new BorrowRequestApprovedEvent(
        view.id,
        view.user.id,
        view.user.email,
        view.user.name,
        view.fromDate,
        view.toDate,
        view.books.map((book) => ({
          title: book.title,
          quantity: book.quantity,
        })),
      ),
    );

    return view;
  }

  async reject(id: number, reason: string): Promise<BorrowRequestAdminView> {
    const request = await this.loadReviewableRequestOrThrow(id);

    request.status = BorrowRequestStatus.REJECTED;
    request.rejectReason = reason;
    await this.borrowRequestRepo.save(request);

    const view = await this.findOneForAdmin(id);

    this.eventEmitter.emit(
      EVENT_NAMES.BORROW_REQUEST_REJECTED,
      new BorrowRequestRejectedEvent(
        view.id,
        view.user.id,
        view.user.email,
        view.user.name,
        view.fromDate,
        view.toDate,
        view.rejectReason,
      ),
    );

    return view;
  }

  private async loadReviewableRequestOrThrow(
    id: number,
  ): Promise<BorrowRequest> {
    const request = await this.borrowRequestRepo.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(i18n()?.t('error.borrowRequest.notFound'));
    }

    if (!REVIEWABLE_STATUSES.includes(request.status)) {
      throw new BadRequestException(
        i18n()?.t('error.borrowRequest.onlyPendingReviewable'),
      );
    }

    return request;
  }
}
