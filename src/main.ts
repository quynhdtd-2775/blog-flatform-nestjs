import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const formatted = errors.map((err) => ({
          field: err.property,
          message: Object.values(err.constraints ?? {})[0],
        }));

        return new UnprocessableEntityException({
          success: false,
          errors: formatted,
        });
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
