import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { signup: jest.Mock; login: jest.Mock; logout: jest.Mock };

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('logout', () => {
    it('revokes only the caller own token, using jti/exp from the verified request', async () => {
      const req = {
        user: { jti: 'jti-1', exp: 1234567890 },
      } as unknown as Parameters<AuthController['logout']>[0];

      await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith('jti-1', 1234567890);
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });
  });
});
