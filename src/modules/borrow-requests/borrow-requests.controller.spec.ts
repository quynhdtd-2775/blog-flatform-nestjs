import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BorrowRequestsController } from './borrow-requests.controller';
import { BorrowRequestsService } from './borrow-requests.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RedisService } from '../redis/redis.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('BorrowRequestsController', () => {
  let controller: BorrowRequestsController;
  let service: {
    create: jest.Mock;
    findHistory: jest.Mock;
    cancel: jest.Mock;
  };

  const user: AuthenticatedUser = {
    sub: 42,
    email: 'user@example.com',
    role: 'USER' as never,
    jti: 'jti-1',
    exp: 9999999999,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findHistory: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BorrowRequestsController],
      providers: [
        { provide: BorrowRequestsService, useValue: service },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: RedisService,
          useValue: { exists: jest.fn(), setWithTtl: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BorrowRequestsController>(BorrowRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a borrow request using the userId from the JWT, never the body', async () => {
    const dto = {
      fromDate: '2026-08-10',
      toDate: '2026-08-17',
      books: [{ bookId: 1, quantity: 1 }],
    };

    await controller.create(user, dto);

    expect(service.create).toHaveBeenCalledWith(42, dto);
  });

  it('fetches history scoped to the JWT user, ignoring any userId query param', async () => {
    const query = { page: 1, limit: 10 };

    await controller.findHistory(user, query);

    expect(service.findHistory).toHaveBeenCalledWith(42, query);
  });

  it('cancels using the JWT user as the owner check', async () => {
    await controller.cancel(user, 5);

    expect(service.cancel).toHaveBeenCalledWith(42, 5);
  });
});
