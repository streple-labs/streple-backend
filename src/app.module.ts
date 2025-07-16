import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminsModule } from './app/admins/admins.module';
import { AuthModule } from './app/auth/auth.module';
import { CopyTradingModule } from './app/copy-trading/copy-trading.module';
import { EmailCenterModule } from './app/email-center/email-center.module';
import { LearninghubModule } from './app/learninghub/learninghub.module';
import { UsersModule } from './app/users/users.module';
import ormConfig from './config/ormconfig';
import { GlobalModule } from './global/global.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: ormConfig }),
    AdminsModule,
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
    // BullModule.forRoot({
    //   redis: {
    //     host: 'localhost',
    //     port: 6379,
    //   },
    // }),
    LearninghubModule,
    EmailCenterModule,
    GlobalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
