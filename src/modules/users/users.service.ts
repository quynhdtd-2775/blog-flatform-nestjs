import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { i18n } from 'src/helpers/common';
import { Repository } from 'typeorm';
import { UserSerializer, UserViewType } from './user.serializer';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  createUser(email: string, password: string): Promise<User> {
    const user = this.userRepo.create({ email, password });
    return this.userRepo.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByIdOrThrow(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(i18n()?.t('error.auth.userNotFound'));
    }

    const { ...safeUser } = user;

    return safeUser;
  }

  async findByEmailOrThrow(email: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(i18n()?.t('error.auth.userNotFound'));
    }

    return user;
  }

  async getCurrentUserByIdOrThrow(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(i18n()?.t('error.validation.userNotFound'));
    }

    return {
      user: new UserSerializer(user, {
        type: UserViewType.FULL_INFO,
      }).serialize(),
    };
  }

  async updateUser(userId: number, updateData: Partial<UpdateUserDto>) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(i18n()?.t('error.validation.userNotFound'));
    }

    if (updateData.email && updateData.email !== user.email) {
      const existedUser = await this.userRepo.findOne({
        where: { email: updateData.email },
      });

      if (existedUser) {
        throw new BadRequestException(i18n()?.t('error.auth.emailExists'));
      }
    }

    Object.assign(user, updateData);
    await this.userRepo.save(user);

    return {
      success: true,
    };
  }
}
