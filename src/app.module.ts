import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import {
  appConfig,
  dbConfig,
  jwtConfig,
  IDbConfig,
  IJwtConfig,
} from './config';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { FilesModule } from './files/files.module';
import { SkillsModule } from './skills/skills.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [dbConfig.KEY],
      useFactory: (configService: IDbConfig) => ({
        ...configService,
        autoLoadEntities: true,
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [jwtConfig.KEY],
      useFactory: (configService: IJwtConfig) => {
        const secret = configService.jwtSecret;
        const expiresIn = configService.jwtExpiresIn;

        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
    UsersModule,
    AuthModule,
    FilesModule,
    SkillsModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
