import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { BorrowRequestsService } from './borrow-requests.service';
import { AdminFindBorrowRequestsDto } from './dto/admin-find-borrow-requests.dto';
import { RejectBorrowRequestDto } from './dto/reject-borrow-request.dto';

@ApiTags('Admin - Borrow Requests')
@ApiBearerAuth()
@Controller('admin/borrow-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBorrowRequestsController {
  constructor(private readonly borrowRequestsService: BorrowRequestsService) {}

  @Get()
  findAll(@Query() query: AdminFindBorrowRequestsDto) {
    return this.borrowRequestsService.findAllForAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.borrowRequestsService.findOneForAdmin(id);
  }

  @Put(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.borrowRequestsService.approve(id);
  }

  @Put(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectBorrowRequestDto,
  ) {
    return this.borrowRequestsService.reject(id, dto.reason);
  }
}
