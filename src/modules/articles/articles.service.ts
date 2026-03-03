import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Brackets, Repository } from 'typeorm';
import { Article } from 'src/database/entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import slugify from 'slugify';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';
import { i18n } from 'src/helpers/common';
import { ArticleSerializer, ArticleViewType } from './article.serializer';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  private extractUserId(user: User & { sub?: number }) {
    return user.id ?? user.sub;
  }

  async create(user: User, createArticleDto: CreateArticleDto) {
    if (!createArticleDto.title) {
      throw new BadRequestException(i18n()?.t('error.validation.required'));
    }

    const authorId = this.extractUserId(user as User & { sub?: number });

    const slug = slugify(createArticleDto.title + '-' + Date.now(), {
      lower: true,
      strict: true,
    });

    try {
      const article = this.articleRepo.create({
        ...createArticleDto,
        author: {
          id: authorId,
        },
      });

      article.slug = slug;
      const savedArticle = await this.articleRepo.save(article);

      const articleWithAuthor = await this.articleRepo.findOne({
        where: { articleId: savedArticle.articleId },
        relations: ['author'],
      });

      if (!articleWithAuthor) {
        throw new BadRequestException(i18n()?.t('error.article.notFound'));
      }

      return {
        success: true,
        article: new ArticleSerializer(articleWithAuthor, {
          type: ArticleViewType.FULL_INFO,
        }).serialize(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(i18n()?.t('error.article.createFailed'));
    }
  }

  async findAll(query: GetArticlesQueryDto = {}) {
    const { tag, author, favorited, page = 2 } = query;

    const ITEMS_PER_PAGE = 2;

    const queryBuilder = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .orderBy('article.createdAt', 'DESC');

    if (tag) {
      queryBuilder.andWhere('article.tagList LIKE :tag', {
        tag: `%${tag}%`,
      });
    }

    if (author) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('author.username = :author', { author }).orWhere(
            'author.email = :author',
            { author },
          );
        }),
      );
    }

    if (favorited !== undefined) {
      queryBuilder.andWhere('article.favorited = :favorited', {
        favorited,
      });
    }

    const skip = (page - 1) * ITEMS_PER_PAGE;

    queryBuilder.take(ITEMS_PER_PAGE).skip(skip);

    const [articles, total] = await queryBuilder.getManyAndCount();

    return {
      articles: articles.map((article) =>
        new ArticleSerializer(article, {
          type: ArticleViewType.FULL_INFO,
        }).serialize(),
      ),

      page: {
        total,
        page,
        items: ITEMS_PER_PAGE,
      },
    };
  }

  async findOne(id: number) {
    const article = await this.articleRepo.findOne({
      where: { articleId: id },
    });

    if (!article) {
      throw new NotFoundException(i18n()?.t('error.article.notFound'));
    }

    return {
      article: new ArticleSerializer(article, {
        type: ArticleViewType.FULL_INFO,
      }).serialize(),
    };
  }

  async loadArticle(id: number) {
    const article = await this.articleRepo.findOne({
      where: { articleId: id },
    });

    if (!article) {
      throw new NotFoundException(i18n()?.t('error.article.notFound'));
    }

    return {
      article: new ArticleSerializer(article, {
        type: ArticleViewType.FULL_INFO,
      }).serialize(),
    };
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    await this.loadArticle(id);

    try {
      await this.articleRepo.save({
        articleId: id,
        ...updateArticleDto,
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(i18n()?.t('error.article.updateFailed'));
    }
  }

  async remove(id: number) {
    try {
      await this.loadArticle(id);
      await this.articleRepo.delete(id);
      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(i18n()?.t('error.article.deleteFailed'));
    }
  }
}
