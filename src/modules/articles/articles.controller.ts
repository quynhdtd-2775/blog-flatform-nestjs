import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { User } from 'src/database/entities/user.entity';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';

@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  async create(
    @Req() req: { user: User },
    @Body('article') body: CreateArticleDto,
  ) {
    return await this.articlesService.create(req.user, body);
  }

  @Get()
  async findAll(@Query() query: GetArticlesQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Get('tags')
  async findByTag() {
    const tags = await this.articlesService.findAllTags();

    return { tags };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(+id, updateArticleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
