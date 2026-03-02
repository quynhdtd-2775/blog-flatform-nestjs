import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: service,
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to service with req.user and body.article', async () => {
    const req = { user: { id: 1, email: 'author@mail.com' } } as any;
    const dto: CreateArticleDto = {
      title: 't',
      description: 'd',
      body: 'b',
    };
    const expected = { success: true };

    service.create.mockResolvedValue(expected);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(controller.create(req, dto)).resolves.toEqual(expected);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(service.create).toHaveBeenCalledWith(req?.user, dto);
  });

  it('findAll delegates query to service', async () => {
    const query = { tag: 'nestjs', limit: 5, offset: 0 } as any;
    const expected = [{ articleId: 1 }];

    service.findAll.mockResolvedValue(expected);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(controller.findAll(query)).resolves.toEqual(expected);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne converts id to number before delegating', async () => {
    const expected = { articleId: 9 };
    service.findOne.mockResolvedValue(expected);

    await expect(controller.findOne('9')).resolves.toEqual(expected);
    expect(service.findOne).toHaveBeenCalledWith(9);
  });

  it('update converts id and delegates dto', async () => {
    const dto: UpdateArticleDto = {
      title: 'updated',
      description: '',
      body: '',
    };
    const expected = { success: true };
    service.update.mockResolvedValue(expected);

    await expect(controller.update('2', dto)).resolves.toEqual(expected);
    expect(service.update).toHaveBeenCalledWith(2, dto);
  });

  it('remove converts id before delegating', async () => {
    const expected = { success: true };
    service.remove.mockResolvedValue(expected);

    await expect(controller.remove('3')).resolves.toEqual(expected);
    expect(service.remove).toHaveBeenCalledWith(3);
  });
});
