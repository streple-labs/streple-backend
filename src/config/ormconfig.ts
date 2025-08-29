import {
  Badge,
  GameProgress,
  GamingOnboarding,
  UserBadge,
} from '@app/gamified/entities';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BlogManager } from 'src/app/blog-manager/entities/blog-manager.entity';
import { CopyTrade } from 'src/app/copy-trading/entities/copy-trade.entity';
import { CopyWallet } from 'src/app/copy-trading/entities/copy-wallet.entity';
import { ProSignal } from 'src/app/copy-trading/entities/pro-signal.entity';
import { Course } from 'src/app/course/course.entity';
import { EmailCenter, WaitList } from 'src/app/email-center/entities';
import { LearningHub } from 'src/app/learninghub/entities/learninghub.entity';
import { User } from '@app/users/entity/user.entity';
import { Privileges, RoleModel } from '@app/users/entity';
import { Trades } from '@app/trades/entities/trader.entity';
import { Balance, Transactions } from '@app/balance/entities';

export default (): TypeOrmModuleOptions => ({
  type: process.env.DB_TYPE as 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    BlogManager,
    CopyTrade,
    CopyWallet,
    ProSignal,
    Course,
    EmailCenter,
    LearningHub,
    User,
    GameProgress,
    GamingOnboarding,
    WaitList,
    RoleModel,
    Privileges,
    Badge,
    UserBadge,
    Trades,
    Balance,
    Transactions,
  ],
  ssl: process.env.NODE_ENV === 'development' ? false : { rejectUnauthorized: false}, // TODO
  synchronize: process.env.NODE_ENV === 'development', // TODO
});
