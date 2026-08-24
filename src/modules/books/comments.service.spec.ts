import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { BooksService } from './books.service';
import { Comment } from '../../database/entities/comment.entity';
import { CommentImage } from '../../database/entities/comment-image.entity';
import { StorageService } from '../storage/storage.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepo: jest.Mocked<Partial<Repository<Comment>>>;
  let commentImageRepo: jest.Mocked<Partial<Repository<CommentImage>>>;
  let booksService: { findOneOrThrow: jest.Mock };
  let storageService: {
    save: jest.Mock;
    remove: jest.Mock;
    getPublicUrl: jest.Mock;
  };

  beforeEach(async () => {
    commentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    commentImageRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    booksService = { findOneOrThrow: jest.fn() };
    storageService = {
      save: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: commentRepo },
        {
          provide: getRepositoryToken(CommentImage),
          useValue: commentImageRepo,
        },
        { provide: BooksService, useValue: booksService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a comment on an existing book without images', async () => {
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
      images: [],
    });

    const result = await service.create(1, 42, { content: 'Great book!' });

    expect(booksService.findOneOrThrow).toHaveBeenCalledWith(1);
    expect(commentRepo.create).toHaveBeenCalledWith({
      book: { id: 1 },
      user: { id: 42 },
      content: 'Great book!',
    });
    expect(commentImageRepo.save).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 10,
      content: 'Great book!',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      user: { id: 42, name: 'Jane Doe' },
      images: [],
    });
  });

  it('creates a comment together with uploaded images', async () => {
    const file = {
      buffer: Buffer.from('fake'),
      originalname: 'photo.png',
    } as Express.Multer.File;

    booksService.findOneOrThrow.mockResolvedValue({ id: 1 });
    (commentRepo.create as jest.Mock).mockReturnValue({
      book: { id: 1 },
      user: { id: 42 },
      content: 'Great book!',
    });
    (commentRepo.save as jest.Mock).mockResolvedValue({ id: 10 });
    storageService.save.mockResolvedValue('comments/uuid.png');
    (commentImageRepo.create as jest.Mock).mockReturnValue({
      path: 'comments/uuid.png',
    });
    (commentImageRepo.save as jest.Mock).mockResolvedValue(undefined);
    (commentRepo.findOneOrFail as jest.Mock).mockResolvedValue({
      id: 10,
      content: 'Great book!',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      user: { id: 42, name: 'Jane Doe' },
      images: [{ id: 1, path: 'comments/uuid.png' }],
    });
    storageService.getPublicUrl.mockReturnValue(
      'http://localhost:3000/uploads/comments/uuid.png',
    );

    const result = await service.create(1, 42, { content: 'Great book!' }, [
      file,
    ]);

    expect(storageService.save).toHaveBeenCalledWith({
      buffer: file.buffer,
      originalName: file.originalname,
      folder: 'comments',
    });
    expect(commentImageRepo.save).toHaveBeenCalled();
    expect(result).toEqual({
      id: 10,
      content: 'Great book!',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      user: { id: 42, name: 'Jane Doe' },
      images: [
        {
          id: 1,
          path: 'comments/uuid.png',
          url: 'http://localhost:3000/uploads/comments/uuid.png',
        },
      ],
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
