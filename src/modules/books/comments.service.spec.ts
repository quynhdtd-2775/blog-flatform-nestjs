import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { BooksService } from './books.service';
import { Comment } from '../../database/entities/comment.entity';
import { CommentImage } from '../../database/entities/comment-image.entity';
import { StorageService } from '../storage/storage.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepo: jest.Mocked<Partial<Repository<Comment>>> & {
    manager: { transaction: jest.Mock };
  };
  let manager: {
    create: jest.Mock;
    save: jest.Mock;
    findOneOrFail: jest.Mock;
  };
  let booksService: { findOneOrThrow: jest.Mock };
  let storageService: {
    save: jest.Mock;
    remove: jest.Mock;
    getPublicUrl: jest.Mock;
  };

  beforeEach(async () => {
    manager = {
      create: jest.fn((_entity, data) => data),
      save: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    commentRepo = {
      manager: {
        transaction: jest.fn((cb: (manager: EntityManager) => unknown) =>
          cb(manager as unknown as EntityManager),
        ),
      },
    } as unknown as jest.Mocked<Partial<Repository<Comment>>> & {
      manager: { transaction: jest.Mock };
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
    manager.save.mockResolvedValueOnce({ id: 10 });
    manager.findOneOrFail.mockResolvedValue({
      id: 10,
      content: 'Great book!',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      user: { id: 42, name: 'Jane Doe' },
      images: [],
    });

    const result = await service.create(1, 42, { content: 'Great book!' });

    expect(booksService.findOneOrThrow).toHaveBeenCalledWith(1);
    expect(manager.create).toHaveBeenCalledWith(Comment, {
      book: { id: 1 },
      user: { id: 42 },
      content: 'Great book!',
    });
    expect(result).toEqual({
      id: 10,
      content: 'Great book!',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      user: { id: 42, name: 'Jane Doe' },
      images: [],
    });
  });

  it('uploads images before opening the transaction, then creates the comment with them', async () => {
    const file = {
      buffer: Buffer.from('fake'),
      originalname: 'photo.png',
    } as Express.Multer.File;

    booksService.findOneOrThrow.mockResolvedValue({ id: 1 });
    storageService.save.mockResolvedValue('comments/uuid.png');
    manager.save.mockResolvedValueOnce({ id: 10 });
    manager.findOneOrFail.mockResolvedValue({
      id: 10,
      content: 'Great book!',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      user: { id: 42, name: 'Jane Doe' },
      images: [{ id: 1, path: 'comments/uuid.png' }],
    });
    storageService.getPublicUrl.mockReturnValue(
      'http://localhost:3000/uploads/comments/uuid.png',
    );

    const result = await service.create(
      1,
      42,
      { content: 'Great book!' },
      [file],
    );

    expect(storageService.save).toHaveBeenCalledWith({
      buffer: file.buffer,
      originalName: file.originalname,
      folder: 'comments',
    });
    expect(manager.create).toHaveBeenCalledWith(CommentImage, {
      comment: { id: 10 },
      path: 'comments/uuid.png',
    });
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
    expect(storageService.save).not.toHaveBeenCalled();
    expect(commentRepo.manager.transaction).not.toHaveBeenCalled();
  });

  it('removes already-uploaded images when the transaction fails', async () => {
    const file = {
      buffer: Buffer.from('fake'),
      originalname: 'photo.png',
    } as Express.Multer.File;

    booksService.findOneOrThrow.mockResolvedValue({ id: 1 });
    storageService.save.mockResolvedValue('comments/uuid.png');
    commentRepo.manager.transaction.mockRejectedValue(
      new Error('constraint violation'),
    );

    await expect(
      service.create(1, 42, { content: 'Great book!' }, [file]),
    ).rejects.toThrow('constraint violation');

    expect(storageService.remove).toHaveBeenCalledWith('comments/uuid.png');
  });
});
