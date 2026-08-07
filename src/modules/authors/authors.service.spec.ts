import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthorsService } from './authors.service';
import { Author } from '../../database/entities/author.entity';
import { Book } from '../../database/entities/book.entity';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let authorRepo: jest.Mocked<Partial<Repository<Author>>>;
  let bookRepo: jest.Mocked<Partial<Repository<Book>>>;

  beforeEach(async () => {
    authorRepo = { findOne: jest.fn() };
    bookRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        { provide: getRepositoryToken(Author), useValue: authorRepo },
        { provide: getRepositoryToken(Book), useValue: bookRepo },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the author with their books', async () => {
    (authorRepo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Robert C. Martin',
      bio: 'Author of Clean Code',
    } as Author);
    (bookRepo.find as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Clean Code', availableQuantity: 7 },
    ]);

    const result = await service.findOne(1);

    expect(result).toEqual({
      id: 1,
      name: 'Robert C. Martin',
      bio: 'Author of Clean Code',
      books: [{ id: 1, title: 'Clean Code', availableQuantity: 7 }],
    });
  });

  it('throws NotFoundException when the author does not exist', async () => {
    (authorRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(bookRepo.find).not.toHaveBeenCalled();
  });
});
