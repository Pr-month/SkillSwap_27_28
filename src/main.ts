import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAppConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const configService = app.get(ConfigService);
  const appConfigData = configService.get<IAppConfig>('APP_CONFIG'); // Получаем конфиг

  if (!appConfigData) {
    // Проверка наличия конфига
    throw new Error('App конфиг не найден');
  }

  await app.listen(appConfigData?.port); // Используем порт из конфига
}

// bootstrap();

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
