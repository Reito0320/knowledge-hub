import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { WebResponseInterceptor } from './http/web-response.interceptor';

export async function createApp(options: { logger?: false } = {}) {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 1024 * 1024 }),
    options,
  );
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new WebResponseInterceptor());
  app.enableShutdownHooks();
  return app;
}
