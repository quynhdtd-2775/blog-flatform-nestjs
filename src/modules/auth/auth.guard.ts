import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { i18n } from 'src/helpers/common';
import { RedisService } from '../redis/redis.service';
import { REVOKED_TOKEN_PREFIX } from './auth.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(i18n().t('error.auth.validAccessToken'));
    }

    let payload: { jti?: string; [key: string]: unknown };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        i18n().t('error.auth.invalidAccessToken'),
      );
    }

    if (payload.jti && (await this.isTokenRevoked(payload.jti))) {
      throw new UnauthorizedException(
        i18n().t('error.auth.invalidAccessToken'),
      );
    }

    request['user'] = payload;
    return true;
  }

  private async isTokenRevoked(jti: string): Promise<boolean> {
    try {
      return await this.redisService.exists(`${REVOKED_TOKEN_PREFIX}${jti}`);
    } catch (error) {
      this.logger.warn(
        `Redis unavailable while checking token revocation, allowing request: ${(error as Error).message}`,
      );
      return false;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
