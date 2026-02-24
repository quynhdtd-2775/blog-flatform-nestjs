import { MODULE_METADATA } from '@nestjs/common/constants';
import { TypeOrmModule } from '@nestjs/typeorm';

jest.mock(
  'src/database/entities/user.entity',
  () => ({
    User: class User {},
  }),
  { virtual: true },
);

jest.mock(
  'src/helpers/common',
  () => ({
    i18n: jest.fn(() => ({
      t: jest.fn(),
    })),
  }),
  { virtual: true },
);

import { UsersController } from './users.controller';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';

describe('UsersModule', () => {
  it('should be defined', () => {
    expect(UsersModule).toBeDefined();
  });

  it('should register expected module metadata', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, UsersModule);
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      UsersModule,
    );
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      UsersModule,
    );
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, UsersModule);

    expect(Array.isArray(imports)).toBe(true);
    expect(imports).toHaveLength(2);
    expect(imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: TypeOrmModule }),
      ]),
    );
    expect(imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ forwardRef: expect.any(Function) }),
      ]),
    );

    expect(providers).toEqual(expect.arrayContaining([UsersService]));
    expect(controllers).toEqual(expect.arrayContaining([UsersController]));
    expect(exports).toEqual(expect.arrayContaining([UsersService]));
  });
});
