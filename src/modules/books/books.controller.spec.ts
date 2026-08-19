import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RedisService } from '../redis/redis.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('BooksController', () => {
  let controller: BooksController;
  let service: { findAll: jest.Mock; findOne: jest.Mock };
  let commentsService: { create: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn(), findOne: jest.fn() };
    commentsService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        { provide: BooksService, useValue: service },
        { provide: CommentsService, useValue: commentsService },
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

    controller = module.get<BooksController>(BooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates list queries to the service', async () => {
    const query = { page: 1, limit: 10 };
    await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates detail lookups to the service', async () => {
    await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('creates a comment using the userId from the JWT, never the body', async () => {
    const user: AuthenticatedUser = {
      sub: 42,
      email: 'user@example.com',
      role: 'USER' as never,
      iat: 1700000000,
      exp: 9999999999,
    };
    const dto = { content: 'Great book!' };

    await controller.createComment(1, user, dto);

    expect(commentsService.create).toHaveBeenCalledWith(1, 42, dto);
  });
});
