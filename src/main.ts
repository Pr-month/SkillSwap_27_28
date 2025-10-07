import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAppConfig } from './config';
import { AllExpectionFilter } from './common/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
     app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExpectionFilter());
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
