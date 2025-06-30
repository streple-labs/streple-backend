import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import ormConfig from './config/ormconfig';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CopyTradingModule } from './copy-trading/copy-trading.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: ormConfig }),
    UsersModule,
    AuthModule,
    CopyTradingModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // time to live in milliseconds = 60 seconds
          limit: 3, // max 3 requests within the TTL (3 requests per minutes)
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
