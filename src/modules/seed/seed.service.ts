import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const email = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@example.com',
    );
    const password = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'Admin@123',
    );
    const name = this.configService.get<string>('ADMIN_NAME', 'Administrator');

    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersService.createUser(
      email,
      hashedPassword,
      name,
      UserRole.ADMIN,
    );

    this.logger.log(`Seeded default admin account: ${email}`);
  }
}
