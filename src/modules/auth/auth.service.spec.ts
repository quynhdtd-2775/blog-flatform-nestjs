import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
import { USER_LOGOUT_PREFIX } from './auth.constants';

interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
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
  let configService: { get: jest.Mock };

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
    configService = { get: jest.fn().mockReturnValue('1d') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        { provide: RedisService, useValue: redisService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('signs a JWT payload with the user id, email, and role', async () => {
      usersService.findByEmailOrThrow.mockResolvedValue(mockUser);

      await service.login('user@example.com', plainPassword);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
      const payload = jwtService.signAsync.mock.calls[0][0];

      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });
  });

  describe('logout', () => {
    it('marks all sessions for the user as revoked as of now, with TTL matching JWT_EXPIRES_IN', async () => {
      configService.get.mockReturnValue('1h');

      await service.logout(1);

      expect(redisService.setWithTtl).toHaveBeenCalledWith(
        `${USER_LOGOUT_PREFIX}1`,
        expect.any(String),
        3600,
      );
    });
  });
});
