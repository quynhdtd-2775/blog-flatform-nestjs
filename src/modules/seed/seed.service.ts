import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../../database/entities/user.entity';
import { Author } from '../../database/entities/author.entity';
import { Category } from '../../database/entities/category.entity';
import { Publisher } from '../../database/entities/publisher.entity';
import { Book } from '../../database/entities/book.entity';
import { Comment } from '../../database/entities/comment.entity';
import {
  BorrowRequest,
  BorrowRequestStatus,
} from '../../database/entities/borrow-request.entity';
import { BorrowRequestBook } from '../../database/entities/borrow-request-book.entity';
import { UsersService } from '../users/users.service';

const DUMMY_USER_PASSWORD = 'User@123';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @InjectRepository(Author)
    private readonly authorRepo: Repository<Author>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Publisher)
    private readonly publisherRepo: Repository<Publisher>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(BorrowRequest)
    private readonly borrowRequestRepo: Repository<BorrowRequest>,
    @InjectRepository(BorrowRequestBook)
    private readonly borrowRequestBookRepo: Repository<BorrowRequestBook>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdminUser();
    await this.seedDummyData();
  }

  private async seedAdminUser() {
    const email = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@example.com',
    );
    const password = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'Admin@123',
    );
    const name = this.configService.get<string>('ADMIN_NAME', 'Administrator');

    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersService.createUser(
      email,
      hashedPassword,
      name,
      UserRole.ADMIN,
    );

    this.logger.log(`Seeded default admin account: ${email}`);
  }

  private async seedDummyData() {
    const bookCount = await this.bookRepo.count();

    if (bookCount > 0) {
      return;
    }

    const users = await this.seedUsers();
    const categories = await this.categoryRepo.save(
      this.categoryRepo.create([
        { name: 'Fiction' },
        { name: 'Science' },
        { name: 'History' },
        { name: 'Technology' },
      ]),
    );
    const publishers = await this.publisherRepo.save(
      this.publisherRepo.create([
        { name: "O'Reilly Media" },
        { name: 'Penguin Books' },
        { name: 'Addison-Wesley' },
      ]),
    );
    const authors = await this.authorRepo.save(
      this.authorRepo.create([
        { name: 'Robert C. Martin', bio: 'Author of Clean Code.' },
        { name: 'Andrew Hunt', bio: 'Co-author of The Pragmatic Programmer.' },
        { name: 'George Orwell', bio: 'English novelist and essayist.' },
        { name: 'Yuval Noah Harari', bio: 'Historian and author of Sapiens.' },
      ]),
    );

    const books = await this.bookRepo.save(
      this.bookRepo.create([
        {
          title: 'Clean Code',
          description: 'A Handbook of Agile Software Craftsmanship.',
          author: authors[0],
          publisher: publishers[2],
          category: categories[3],
          totalQuantity: 5,
          availableQuantity: 5,
        },
        {
          title: 'The Pragmatic Programmer',
          description: 'Your journey to mastery.',
          author: authors[1],
          publisher: publishers[0],
          category: categories[3],
          totalQuantity: 4,
          availableQuantity: 4,
        },
        {
          title: '1984',
          description: 'A dystopian social science fiction novel.',
          author: authors[2],
          publisher: publishers[1],
          category: categories[0],
          totalQuantity: 6,
          availableQuantity: 6,
        },
        {
          title: 'Sapiens',
          description: 'A Brief History of Humankind.',
          author: authors[3],
          publisher: publishers[1],
          category: categories[2],
          totalQuantity: 3,
          availableQuantity: 3,
        },
      ]),
    );

    await this.commentRepo.save(
      this.commentRepo.create([
        {
          book: books[0],
          user: users[0],
          content: 'Great read, changed how I write code.',
        },
        {
          book: books[2],
          user: users[1],
          content: 'A timeless classic.',
        },
      ]),
    );

    await this.seedBorrowRequests(users, books);

    this.logger.log('Seeded dummy library data.');
  }

  private async seedUsers(): Promise<User[]> {
    const dummyUsers = [
      { email: 'alice@example.com', name: 'Alice Nguyen' },
      { email: 'bob@example.com', name: 'Bob Tran' },
      { email: 'carol@example.com', name: 'Carol Le' },
    ];

    const hashedPassword = await bcrypt.hash(DUMMY_USER_PASSWORD, 10);
    const users: User[] = [];

    for (const dummyUser of dummyUsers) {
      const existing = await this.usersService.findByEmail(dummyUser.email);
      users.push(
        existing ??
          (await this.usersService.createUser(
            dummyUser.email,
            hashedPassword,
            dummyUser.name,
            UserRole.USER,
          )),
      );
    }

    return users;
  }

  private async seedBorrowRequests(users: User[], books: Book[]) {
    const borrowRequest = await this.borrowRequestRepo.save(
      this.borrowRequestRepo.create({
        user: users[0],
        fromDate: '2026-08-01',
        toDate: '2026-08-15',
        status: BorrowRequestStatus.APPROVED,
      }),
    );

    await this.borrowRequestBookRepo.save(
      this.borrowRequestBookRepo.create({
        borrowRequest,
        book: books[1],
        quantity: 1,
      }),
    );

    const pendingRequest = await this.borrowRequestRepo.save(
      this.borrowRequestRepo.create({
        user: users[1],
        fromDate: '2026-08-10',
        toDate: '2026-08-20',
        status: BorrowRequestStatus.PENDING,
      }),
    );

    await this.borrowRequestBookRepo.save(
      this.borrowRequestBookRepo.create({
        borrowRequest: pendingRequest,
        book: books[3],
        quantity: 1,
      }),
    );
  }
}
