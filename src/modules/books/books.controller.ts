import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { FindBooksDto } from './dto/find-books.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(@Query() query: FindBooksDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }
}
