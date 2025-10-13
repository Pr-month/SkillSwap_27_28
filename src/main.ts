import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAppConfig } from './config';
import { AllExpectionFilter } from './common/all-exception.filter';
// import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExpectionFilter());
  const configService = app.get(ConfigService);
  const appConfigData = configService.get<IAppConfig>('APP_CONFIG'); // Получаем конфиг

  if (!appConfigData) {
    // Проверка наличия конфига
    throw new Error('App конфиг не найден');
  }
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SkillSwap_27-28')
    .setDescription('Документирование API проекта SkillSwap_27-28')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(appConfigData?.port); // Используем порт из конфига
}

// bootstrap();

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
