import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { User } from '../../database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { i18n } from 'src/helpers/common';
import { UsersService } from '../users/users.service';
import { UserSerializer, UserViewType } from '../users/user.serializer';
import { RedisService } from '../redis/redis.service';
import { USER_LOGOUT_PREFIX, parseDurationToSeconds } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  // 🔹 SIGNUP
  async signup(email: string, password: string, name: string) {
    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      throw new BadRequestException(i18n()?.t('error.auth.emailExists'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser(
      email,
      hashedPassword,
      name,
    );

    return {
      message: i18n()?.t('message.signupSuccess'),
      user: new UserSerializer(user, {
        type: UserViewType.FULL_INFO,
      }).serialize(),
    };
  }

  // 🔹 LOGIN
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailOrThrow(email);

    const passwordHash = user?.password || '';

    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!user || !isMatch) {
      throw new BadRequestException(
        i18n()?.t('error.validation.invalidCredentials'),
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  // 🔹 LOGOUT (all sessions/devices for this user)
  async logout(userId: number) {
    const ttlSeconds = parseDurationToSeconds(
      this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
    );
    const now = Math.floor(Date.now() / 1000);

    await this.redisService.setWithTtl(
      `${USER_LOGOUT_PREFIX}${userId}`,
      String(now),
      ttlSeconds,
    );

    return {
      message: i18n()?.t('message.logoutSuccess'),
    };
  }
}
