import { BalanceModule } from '@app/balance/module';
import { CacheModule } from '@nestjs/cache-manager';
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
import { TradesModule } from './app/trades/trades.module';
import { UsersModule } from './app/users/users.module';
import ormConfig from './config/ormconfig';
import { GlobalModule } from './global/global.module';
import { JwtAuthGuard, PermissionsGuard } from './global/guards';
import { SeederModule } from './seeders/seeder.module';

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
          ttl: 60000,
          limit: 3,
        },
      ],
    }),
    CacheModule.register({
      ttl: 60 * 60,
      max: 1000,
    }),
    LearninghubModule,
    EmailCenterModule,
    GlobalModule,
    BlogManagerModule,
    GamifiedModule,
    SeederModule,
    TradesModule,
    BalanceModule,
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
