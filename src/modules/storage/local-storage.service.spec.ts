import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { mkdir, rm, writeFile } from 'fs/promises';
import { LocalStorageService } from './local-storage.service';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  rm: jest.fn(),
}));

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'UPLOAD_DIR') return 'uploads';
              if (key === 'APP_URL') return 'http://localhost:3000';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LocalStorageService>(LocalStorageService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('save', () => {
    it('writes the file under the given folder with a generated safe filename', async () => {
      const key = await service.save({
        buffer: Buffer.from('fake'),
        originalName: 'My Original Photo.PNG',
        folder: 'users',
      });

      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('uploads/users'),
        { recursive: true },
      );
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('uploads/users'),
        Buffer.from('fake'),
      );
      expect(key.startsWith('users')).toBe(true);
      expect(key.endsWith('.png')).toBe(true);
      expect(key).not.toContain('My Original Photo');
    });
  });

  describe('remove', () => {
    it('removes the file at the given key', async () => {
      await service.remove('users/abc.png');

      expect(rm).toHaveBeenCalledWith(
        expect.stringContaining('uploads/users/abc.png'),
        { force: true },
      );
    });

    it('swallows errors when the file cannot be removed', async () => {
      (rm as jest.Mock).mockRejectedValueOnce(new Error('boom'));

      await expect(service.remove('users/abc.png')).resolves.toBeUndefined();
    });
  });

  describe('getPublicUrl', () => {
    it('builds an absolute URL from the app URL and key', () => {
      expect(service.getPublicUrl('users/abc.png')).toBe(
        'http://localhost:3000/uploads/users/abc.png',
      );
    });
  });
});
