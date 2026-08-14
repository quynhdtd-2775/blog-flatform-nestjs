import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { dataSource } from './configs/typeorm.config';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import { ArticlesModule } from './modules/articles/articles.module';
import { SeedModule } from './modules/seed/seed.module';
import { RedisModule } from './modules/redis/redis.module';
import { BooksModule } from './modules/books/books.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { BorrowRequestsModule } from './modules/borrow-requests/borrow-requests.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PublishersModule } from './modules/publishers/publishers.module';
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
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    ArticlesModule,
    SeedModule,
    BooksModule,
    AuthorsModule,
    BorrowRequestsModule,
    CategoriesModule,
    PublishersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
