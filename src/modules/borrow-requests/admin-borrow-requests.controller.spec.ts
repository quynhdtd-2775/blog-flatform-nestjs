import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AdminBorrowRequestsController } from './admin-borrow-requests.controller';
import { BorrowRequestsService } from './borrow-requests.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RedisService } from '../redis/redis.service';

describe('AdminBorrowRequestsController', () => {
  let controller: AdminBorrowRequestsController;
  let service: {
    findAllForAdmin: jest.Mock;
    findOneForAdmin: jest.Mock;
    approve: jest.Mock;
    reject: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAllForAdmin: jest.fn(),
      findOneForAdmin: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBorrowRequestsController],
      providers: [
        { provide: BorrowRequestsService, useValue: service },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: RedisService,
          useValue: { exists: jest.fn(), setWithTtl: jest.fn() },
        },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminBorrowRequestsController>(
      AdminBorrowRequestsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates list queries to the service', async () => {
    const query = { page: 1, limit: 10 };
    await controller.findAll(query);
    expect(service.findAllForAdmin).toHaveBeenCalledWith(query);
  });

  it('delegates detail lookups to the service', async () => {
    await controller.findOne(1);
    expect(service.findOneForAdmin).toHaveBeenCalledWith(1);
  });

  it('delegates approve to the service', async () => {
    await controller.approve(1);
    expect(service.approve).toHaveBeenCalledWith(1);
  });

  it('delegates reject with the reason to the service', async () => {
    await controller.reject(1, { reason: 'Not available' });
    expect(service.reject).toHaveBeenCalledWith(1, 'Not available');
  });
});
