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
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Articles')
@ApiBearerAuth()
@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @ApiBody({
    schema: {
      properties: {
        article: { $ref: '#/components/schemas/CreateArticleDto' },
      },
    },
    examples: {
      default: {
        value: {
          article: {
            title: 'How to write clean code',
            description: 'A short introduction to writing maintainable code.',
            body: 'Full article content goes here...',
            tagList: ['nestjs', 'clean-code'],
          },
        },
      },
    },
  })
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
