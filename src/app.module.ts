import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { dataSource } from './configs/typeorm.config';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import { SeedModule } from './modules/seed/seed.module';
import { RedisModule } from './modules/redis/redis.module';
import { BooksModule } from './modules/books/books.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { BorrowRequestsModule } from './modules/borrow-requests/borrow-requests.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PublishersModule } from './modules/publishers/publishers.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StorageModule } from './modules/storage/storage.module';
import * as path from 'path';

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
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'),
      serveRoot: '/uploads',
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    StorageModule,
    AuthModule,
    UsersModule,
    SeedModule,
    BooksModule,
    AuthorsModule,
    BorrowRequestsModule,
    CategoriesModule,
    PublishersModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
