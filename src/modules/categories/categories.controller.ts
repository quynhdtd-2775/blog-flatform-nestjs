import { Controller, Get, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { FindCategoriesDto } from './dto/find-categories.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Query() query: FindCategoriesDto) {
    return this.categoriesService.findAll(query);
  }
}
