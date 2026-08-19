import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from './auth.guard';
import { RedisService } from '../redis/redis.service';
import { USER_LOGOUT_PREFIX } from './auth.constants';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let redisService: { get: jest.Mock };
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
    redisService = { get: jest.fn() };
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

  it('allows a token issued before any logout-all for that user', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    redisService.get.mockResolvedValue(null);

    const context = buildContext('Bearer good-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(redisService.get).toHaveBeenCalledWith(`${USER_LOGOUT_PREFIX}1`);
  });

  it('rejects a token issued before the user logged out everywhere', async () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 100;
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      iat: issuedAt,
      exp: issuedAt + 3600,
    });
    redisService.get.mockResolvedValue(String(issuedAt + 10));

    await expect(
      guard.canActivate(buildContext('Bearer stale-token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a token issued after the last logout-all', async () => {
    const loggedOutAt = Math.floor(Date.now() / 1000) - 100;
    const issuedAt = loggedOutAt + 50;
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      iat: issuedAt,
      exp: issuedAt + 3600,
    });
    redisService.get.mockResolvedValue(String(loggedOutAt));

    await expect(
      guard.canActivate(buildContext('Bearer fresh-token')),
    ).resolves.toBe(true);
  });

  it('allows a token issued in the same second as the logout-all marker (regression: a fresh login right after logout must not be rejected)', async () => {
    const now = Math.floor(Date.now() / 1000);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      iat: now,
      exp: now + 3600,
    });
    redisService.get.mockResolvedValue(String(now));

    await expect(
      guard.canActivate(buildContext('Bearer same-second-login-token')),
    ).resolves.toBe(true);
  });

  it('fails open (allows the request) when Redis is unavailable', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    redisService.get.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      guard.canActivate(buildContext('Bearer good-token')),
    ).resolves.toBe(true);
  });

  it('skips the revocation check for tokens without sub/iat', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    await expect(
      guard.canActivate(buildContext('Bearer legacy-token')),
    ).resolves.toBe(true);
    expect(redisService.get).not.toHaveBeenCalled();
  });
});
