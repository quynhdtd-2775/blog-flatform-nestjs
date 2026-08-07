import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from './auth.guard';
import { RedisService } from '../redis/redis.service';
import { REVOKED_TOKEN_PREFIX } from './auth.constants';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let redisService: { exists: jest.Mock };
  let configService: { get: jest.Mock };

  const buildContext = (authHeader?: string): ExecutionContext => {
    const request: Record<string, unknown> = {
      headers: authHeader ? { authorization: authHeader } : {},
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    redisService = { exists: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('secret') };

    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      redisService as unknown as RedisService,
    );
  });

  it('rejects requests with no Authorization header', async () => {
    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an invalid or expired JWT', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));

    await expect(
      guard.canActivate(buildContext('Bearer bad-token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a valid, non-revoked token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      jti: 'jti-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    redisService.exists.mockResolvedValue(false);

    const context = buildContext('Bearer good-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(redisService.exists).toHaveBeenCalledWith(
      `${REVOKED_TOKEN_PREFIX}jti-1`,
    );
  });

  it('rejects a revoked token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      jti: 'jti-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    redisService.exists.mockResolvedValue(true);

    await expect(
      guard.canActivate(buildContext('Bearer revoked-token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails open (allows the request) when Redis is unavailable', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      jti: 'jti-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    redisService.exists.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      guard.canActivate(buildContext('Bearer good-token')),
    ).resolves.toBe(true);
  });

  it('skips the revocation check for tokens without a jti', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    await expect(
      guard.canActivate(buildContext('Bearer legacy-token')),
    ).resolves.toBe(true);
    expect(redisService.exists).not.toHaveBeenCalled();
  });
});
