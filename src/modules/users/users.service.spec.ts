import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../../database/entities/user.entity';
import { UsersService } from './users.service';
import { StorageService } from '../storage/storage.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: { findOne: jest.Mock; save: jest.Mock };
  let storageService: {
    save: jest.Mock;
    remove: jest.Mock;
    getPublicUrl: jest.Mock;
  };

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), save: jest.fn() };
    storageService = {
      save: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateAvatar', () => {
    const file = {
      buffer: Buffer.from('fake'),
      originalname: 'avatar.png',
    } as Express.Multer.File;

    it('uploads and persists the avatar path, removing the old one', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 7,
        avatarPath: 'users/old.png',
      } as User);
      storageService.save.mockResolvedValue('users/new.png');
      storageService.getPublicUrl.mockReturnValue(
        'http://localhost:3000/uploads/users/new.png',
      );

      const result = await service.updateAvatar(7, file);

      expect(storageService.remove).toHaveBeenCalledWith('users/old.png');
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ avatarPath: 'users/new.png' }),
      );
      expect(result).toEqual({
        avatarPath: 'users/new.png',
        avatarUrl: 'http://localhost:3000/uploads/users/new.png',
      });
    });
  });
});
