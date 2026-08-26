import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'src/database/entities/user.entity';
import { checkEmailExists, i18n, loadUser } from 'src/helpers/common';
import { Repository } from 'typeorm';
import { UserSerializer, UserViewType } from './user.serializer';
import { UpdateUserDto } from './dto/update-user.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly storageService: StorageService,
  ) {}

  createUser(
    email: string,
    password: string,
    name: string,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    const user = this.userRepo.create({ email, password, name, role });
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

  async updateAvatar(userId: number, file: Express.Multer.File) {
    const user = await loadUser(this.userRepo, userId);

    const key = await this.storageService.save({
      buffer: file.buffer,
      originalName: file.originalname,
      folder: 'users',
    });

    const oldAvatarPath = user.avatarPath;
    user.avatarPath = key;
    await this.userRepo.save(user);

    if (oldAvatarPath) {
      await this.storageService.remove(oldAvatarPath);
    }

    return {
      avatarPath: user.avatarPath,
      avatarUrl: this.storageService.getPublicUrl(user.avatarPath),
    };
  }
}
