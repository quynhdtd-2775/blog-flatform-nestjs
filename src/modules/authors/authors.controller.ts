import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { FindAuthorsDto } from './dto/find-authors.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  findAll(@Query() query: FindAuthorsDto) {
    return this.authorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authorsService.findOne(id);
  }
}
