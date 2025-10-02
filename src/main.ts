import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAppConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.use((error: any, req: any, res: any, next: any) => {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        statusCode: 413,
        message: 'File too large. Maximum size is 2MB',
      });
    }
    next(error);
  });
  
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
