import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { UsersController } from './modules/users/users.controller';
import { dataSource } from './configs/typeorm.config';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => dataSource.options,
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController, UsersController],
  providers: [AppService],
})
export class AppModule {}
