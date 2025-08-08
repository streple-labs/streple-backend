import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './app/auth/auth.module';
import { BlogManagerModule } from './app/blog-manager/blog-manager.module';
import { CopyTradingModule } from './app/copy-trading/copy-trading.module';
import { EmailCenterModule } from './app/email-center/email-center.module';
import { GamifiedModule } from './app/gamified/gamified.module';
import { LearninghubModule } from './app/learninghub/learninghub.module';
import { UsersModule } from './app/users/users.module';
import ormConfig from './config/ormconfig';
import { GlobalModule } from './global/global.module';
import { JwtAuthGuard, PermissionsGuard } from './global/guards';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: ormConfig }),
    UsersModule,
    CopyTradingModule,
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // time to live in milliseconds = 60 seconds
          limit: 3, // max 3 requests within the TTL (3 requests per minutes)
        },
      ],
    }),
    LearninghubModule,
    EmailCenterModule,
    GlobalModule,
    BlogManagerModule,
    GamifiedModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    AppService,
  ],
})
export class AppModule {}
