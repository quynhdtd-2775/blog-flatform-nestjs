import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import {
  User,
  UserRole,
  UserStatus,
} from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { AuthService } from './auth.service';
import { REVOKED_TOKEN_PREFIX } from './auth.constants';

interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  jti: string;
}

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: {
    signAsync: jest.Mock<Promise<string>, [JwtPayload]>;
  };
  let usersService: {
    findByEmail: jest.Mock;
    findByEmailOrThrow: jest.Mock;
    createUser: jest.Mock;
  };
  let redisService: {
    setWithTtl: jest.Mock<Promise<void>, [string, string, number]>;
    exists: jest.Mock;
  };

  const plainPassword = 'correct-password';
  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    password: bcrypt.hashSync(plainPassword, 10),
    name: 'Test User',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    usersService = {
      findByEmail: jest.fn(),
      findByEmailOrThrow: jest.fn(),
      createUser: jest.fn(),
    };
    redisService = {
      setWithTtl: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('signs a JWT payload that includes a unique jti and the user role', async () => {
      usersService.findByEmailOrThrow.mockResolvedValue(mockUser);

      await service.login('user@example.com', plainPassword);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
      const payload = jwtService.signAsync.mock.calls[0][0];

      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
      expect(typeof payload.jti).toBe('string');
      expect(payload.jti.length).toBeGreaterThan(0);
    });
  });

  describe('logout', () => {
    it('revokes the token in Redis with TTL equal to the remaining lifetime', async () => {
      const jti = 'test-jti';
      const nowSeconds = Math.floor(Date.now() / 1000);
      const exp = nowSeconds + 3600;

      await service.logout(jti, exp);

      expect(redisService.setWithTtl).toHaveBeenCalledWith(
        `${REVOKED_TOKEN_PREFIX}${jti}`,
        '1',
        expect.any(Number),
      );
      const ttlArg = redisService.setWithTtl.mock.calls[0][2];
      expect(ttlArg).toBeGreaterThan(3500);
      expect(ttlArg).toBeLessThanOrEqual(3600);
    });

    it('does not write to Redis when the token is already expired', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);

      await service.logout('expired-jti', nowSeconds - 10);

      expect(redisService.setWithTtl).not.toHaveBeenCalled();
    });
  });
});
