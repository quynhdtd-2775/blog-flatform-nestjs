import { BadRequestException, NotFoundException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { User } from 'src/database/entities/user.entity';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { Repository } from 'typeorm';

export function i18n() {
  return (
    I18nContext.current() ?? {
      t: (key: string) => key,
    }
  );
}

export async function loadUser(
  userRepo: Repository<User>,
  userId: number,
): Promise<User> {
  const user = await userRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException(i18n()?.t('error.auth.userNotFound'));
  }

  return user;
}

export async function checkEmailExists(
  updateData: Partial<UpdateUserDto>,
  userRepo: Repository<User>,
  user: User,
) {
  if (updateData.email && updateData.email !== user.email) {
    const existedUser = await userRepo.findOne({
      where: { email: updateData.email },
    });

    if (existedUser) {
      throw new BadRequestException(i18n()?.t('error.auth.emailExists'));
    }
  }
}
