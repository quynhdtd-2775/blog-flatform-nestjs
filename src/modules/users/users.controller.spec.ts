import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { JwtAuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RedisService } from '../redis/redis.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { findById: jest.Mock; updateAvatar: jest.Mock };

  beforeEach(async () => {
    service = {
      findById: jest.fn(),
      updateAvatar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: service,
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            exists: jest.fn(),
            setWithTtl: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates avatar upload to the service using the JWT user id', async () => {
    const req = { user: { sub: 7, email: 'user@example.com' } } as never;
    const file = { buffer: Buffer.from('fake') } as Express.Multer.File;

    await controller.uploadAvatar(req, file);

    expect(service.updateAvatar).toHaveBeenCalledWith(7, file);
  });
});
