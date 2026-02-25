import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Repository } from 'typeorm';
import { Article } from 'src/database/entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import slugify from 'slugify';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  async create(user: User, createArticleDto: CreateArticleDto) {
    console.log(user);
    if (!createArticleDto.title) {
      throw new BadRequestException('Title is required');
    }

    const slug = slugify(createArticleDto.title, {
      lower: true,
      strict: true,
    });

    const article = this.articleRepo.create({
      ...createArticleDto,
      author: {
        email: user.email,
      },
    });

    article.slug = slug;
    await this.articleRepo.save(article);

    return {
      success: true,
      article,
    };
  }

  async findAll() {
    const articles = await this.articleRepo.find({
      relations: ['author'],
    });
    const result = articles;

    console.log('result: ', result);
    return articles;
  }

  async findOne(id: number) {
    const article = await this.articleRepo.findOne({
      where: { articleId: id },
    });
    return article;
  }

  update(id: number, updateArticleDto: UpdateArticleDto) {
    console.log(updateArticleDto);
    return `This action updates a #${id} article`;
  }

  remove(id: number) {
    return `This action removes a #${id} article`;
  }
}
