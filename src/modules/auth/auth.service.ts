import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../database/entities/user.entity';
import { I18nContext } from 'nestjs-i18n';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // 🔹 SIGNUP
  async signup(email: string, password: string) {
    const i18n = I18nContext.current();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException(i18n?.t('error.auth.emailExists'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      email,
      password: hashedPassword,
    });

    await this.userRepo.save(user);

    return { message: i18n?.t('message.signupSuccess') };
  }

  // 🔹 LOGIN
  async login(email: string, password: string) {
    const i18n = I18nContext.current();

    const user = await this.userRepo.findOne({ where: { email } });

    const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy_password', 10);

    const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH;

    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!user || !isMatch) {
      throw new BadRequestException(
        i18n?.t('error.validation.invalidCredentials'),
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
