import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { BooksService } from './books.service';
import { Comment } from '../../database/entities/comment.entity';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepo: jest.Mocked<Partial<Repository<Comment>>>;
  let booksService: { findOneOrThrow: jest.Mock };

  beforeEach(async () => {
    commentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    booksService = { findOneOrThrow: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: commentRepo },
        { provide: BooksService, useValue: booksService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a comment on an existing book', async () => {
    booksService.findOneOrThrow.mockResolvedValue({ id: 1 });
    (commentRepo.create as jest.Mock).mockReturnValue({
      book: { id: 1 },
      user: { id: 42 },
      content: 'Great book!',
    });
    (commentRepo.save as jest.Mock).mockResolvedValue({ id: 10 });
    (commentRepo.findOneOrFail as jest.Mock).mockResolvedValue({
      id: 10,
      content: 'Great book!',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      user: { id: 42, name: 'Jane Doe' },
    });

    const result = await service.create(1, 42, { content: 'Great book!' });

    expect(booksService.findOneOrThrow).toHaveBeenCalledWith(1);
    expect(commentRepo.create).toHaveBeenCalledWith({
      book: { id: 1 },
      user: { id: 42 },
      content: 'Great book!',
    });
    expect(result).toEqual({
      id: 10,
      content: 'Great book!',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      user: { id: 42, name: 'Jane Doe' },
    });
  });

  it('propagates NotFoundException when the book does not exist', async () => {
    booksService.findOneOrThrow.mockRejectedValue(new NotFoundException());

    await expect(
      service.create(999, 42, { content: 'Great book!' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(commentRepo.create).not.toHaveBeenCalled();
  });
});
