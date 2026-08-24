import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PublishersService } from './publishers.service';
import { FindPublishersDto } from './dto/find-publishers.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Publishers')
@Controller('publishers')
export class PublishersController {
  constructor(private readonly publishersService: PublishersService) {}

  @Get()
  findAll(@Query() query: FindPublishersDto) {
    return this.publishersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publishersService.findOne(id);
  }
}
