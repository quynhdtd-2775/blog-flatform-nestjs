import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { checkEmailExists, i18n, loadUser } from 'src/helpers/common';
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

  async findByIdOrThrow(id: number): Promise<{ user: any }> {
    const user = await loadUser(this.userRepo, id);

    return {
      user: new UserSerializer(user, {
        type: UserViewType.FULL_INFO,
      }).serialize() as UserSerializer,
    };
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

  async getCurrentUserByIdOrThrow(
    userId: number,
  ): Promise<{ user: UserSerializer }> {
    const user = await loadUser(this.userRepo, userId);

    return {
      user: new UserSerializer(user, {
        type: UserViewType.FULL_INFO,
      }).serialize() as UserSerializer,
    };
  }

  async updateUser(
    userId: number,
    updateData: Partial<UpdateUserDto>,
  ): Promise<{ success: boolean }> {
    const user = await loadUser(this.userRepo, userId);

    await checkEmailExists(updateData, this.userRepo, user);

    Object.assign(user, updateData);
    try {
      await this.userRepo.save(user);

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        i18n()?.t('error.updateUser.failed'),
      );
    }
  }
}
