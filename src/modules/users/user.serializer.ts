import { User } from 'src/database/entities/user.entity';

export enum UserViewType {
  BASIC_INFO = 'BASIC_INFO',
  FULL_INFO = 'FULL_INFO',
  AUTH_INFO = 'AUTH_INFO',
}

export class UserSerializer {
  private static readonly FIELD_MAP: Record<UserViewType, (keyof User)[]> = {
    [UserViewType.BASIC_INFO]: ['id', 'username'],
    [UserViewType.FULL_INFO]: ['id', 'username', 'email', 'bio'],
    [UserViewType.AUTH_INFO]: ['id', 'email'],
  };

  constructor(
    private readonly user: User,
    private readonly options: { type: UserViewType },
  ) {}

  serialize(): Partial<User> {
    const fields = UserSerializer.FIELD_MAP[this.options.type];

    return Object.fromEntries(
      fields.map((field) => [field, this.user[field]]),
    ) as Partial<User>;
  }
}
