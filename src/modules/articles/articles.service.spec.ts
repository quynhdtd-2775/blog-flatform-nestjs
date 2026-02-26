import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ArticlesService } from './articles.service';
import { Article } from 'src/database/entities/article.entity';
import { User } from 'src/database/entities/user.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepo: jest.Mocked<Partial<Repository<Article>>>;

  const createMockQueryBuilder = () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    return qb;
  };

  beforeEach(async () => {
    articleRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(Article),
          useValue: articleRepo,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates article and returns sanitized author', async () => {
      const user = { id: 1 } as User;
      const dto: CreateArticleDto = {
        title: 'Unit Test Title',
        description: 'desc',
        body: 'body',
        tagList: ['nestjs'],
      };

      const createdArticle = {
        ...dto,
        slug: '',
        author: { id: 1 },
      } as unknown as Article;

      const savedArticle = { ...createdArticle, articleId: 11 } as Article;

      (articleRepo.create as jest.Mock).mockReturnValue(createdArticle);
      (articleRepo.save as jest.Mock).mockResolvedValue(savedArticle);
      (articleRepo.findOne as jest.Mock).mockResolvedValue({
        ...savedArticle,
        author: { id: 1, email: 'author@mail.com', username: 'author' },
      });

      const result = await service.create(user, dto);

      expect(articleRepo.create).toHaveBeenCalledWith({
        ...dto,
        author: { id: 1 },
      });
      expect(articleRepo.save).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        article: expect.objectContaining({
          articleId: 11,
          author: { email: 'author@mail.com' },
        }),
      });
    });

    it('throws when title is missing', async () => {
      const user = { id: 1 } as User;

      await expect(
        service.create(user, {
          title: '' as unknown as string,
          description: 'desc',
          body: 'body',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when user payload has no id/sub', async () => {
      const dto: CreateArticleDto = {
        title: 'Title',
        description: 'desc',
        body: 'body',
      };

      await expect(service.create({} as User, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('maps repository errors to BadRequestException', async () => {
      const user = { id: 1 } as User;
      const dto: CreateArticleDto = {
        title: 'Title',
        description: 'desc',
        body: 'body',
      };

      (articleRepo.create as jest.Mock).mockReturnValue({} as Article);
      (articleRepo.save as jest.Mock).mockRejectedValue(new Error('db error'));

      await expect(service.create(user, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('returns mapped articles with author email only', async () => {
      const qb = createMockQueryBuilder();
      (articleRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([
        {
          articleId: 1,
          title: 'A',
          author: { id: 10, email: 'a@mail.com', username: 'u1' },
        },
      ]);

      const result = await service.findAll({
        tag: 'nestjs',
        author: 'u1',
        favorited: true,
        limit: 5,
        offset: 2,
      });

      expect(articleRepo.createQueryBuilder).toHaveBeenCalledWith('article');
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(qb.skip).toHaveBeenCalledWith(2);
      expect(qb.andWhere).toHaveBeenCalledTimes(3);
      expect(result).toEqual([
        expect.objectContaining({
          articleId: 1,
          author: { email: 'a@mail.com' },
        }),
      ]);
    });

    it('uses default pagination when query is empty', async () => {
      const qb = createMockQueryBuilder();
      (articleRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);

      await service.findAll({});

      expect(qb.take).toHaveBeenCalledWith(20);
      expect(qb.skip).toHaveBeenCalledWith(0);
    });
  });

  describe('findOne', () => {
    it('finds one article by id', async () => {
      const article = { articleId: 7 } as Article;
      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);

      const result = await service.findOne(7);

      expect(articleRepo.findOne).toHaveBeenCalledWith({
        where: { articleId: 7 },
      });
      expect(result).toBe(article);
    });
  });

  describe('loadArticle', () => {
    it('returns article when found', async () => {
      const article = { articleId: 7 } as Article;
      (articleRepo.findOne as jest.Mock).mockResolvedValue(article);

      await expect(service.loadArticle(7)).resolves.toBe(article);
    });

    it('throws when article not found', async () => {
      (articleRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.loadArticle(7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('updates existing article', async () => {
      const dto: UpdateArticleDto = { title: 'updated title' };
      jest.spyOn(service, 'loadArticle').mockResolvedValue({} as Article);
      (articleRepo.save as jest.Mock).mockResolvedValue({});

      const result = await service.update(5, dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.loadArticle).toHaveBeenCalledWith(5);
      expect(articleRepo.save).toHaveBeenCalledWith({ articleId: 5, ...dto });
      expect(result).toEqual({ success: true });
    });

    it('throws mapped error when save fails', async () => {
      jest.spyOn(service, 'loadArticle').mockResolvedValue({} as Article);
      (articleRepo.save as jest.Mock).mockRejectedValue(new Error('db fail'));

      await expect(service.update(5, { title: 'new' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('removes existing article', async () => {
      jest.spyOn(service, 'loadArticle').mockResolvedValue({} as Article);
      (articleRepo.delete as jest.Mock).mockResolvedValue({});

      const result = await service.remove(3);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.loadArticle).toHaveBeenCalledWith(3);
      expect(articleRepo.delete).toHaveBeenCalledWith(3);
      expect(result).toEqual({ success: true });
    });

    it('throws mapped error when delete fails', async () => {
      jest.spyOn(service, 'loadArticle').mockResolvedValue({} as Article);
      (articleRepo.delete as jest.Mock).mockRejectedValue(new Error('db fail'));

      await expect(service.remove(3)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
