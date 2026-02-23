import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { i18n } from 'src/helpers/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  // 🔹 SIGNUP
  async signup(email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      throw new BadRequestException(i18n()?.t('error.auth.emailExists'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser(email, hashedPassword);

    return {
      message: i18n()?.t('message.signupSuccess'),
      user,
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
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
