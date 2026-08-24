import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('AuthorsController', () => {
  let controller: AuthorsController;
  let service: { findAll: jest.Mock; findOne: jest.Mock; updateAvatar: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      updateAvatar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [{ provide: AuthorsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthorsController>(AuthorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates list queries to the service', async () => {
    const query = { page: 1, limit: 10 };
    await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates detail lookups to the service', async () => {
    await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('delegates avatar upload to the service', () => {
    const file = { buffer: Buffer.from('fake') } as Express.Multer.File;
    controller.uploadAvatar(1, file);
    expect(service.updateAvatar).toHaveBeenCalledWith(1, file);
  });

  it('rejects avatar upload when no file is provided', () => {
    expect(() =>
      controller.uploadAvatar(1, undefined as unknown as Express.Multer.File),
    ).toThrow();
    expect(service.updateAvatar).not.toHaveBeenCalled();
  });
});
