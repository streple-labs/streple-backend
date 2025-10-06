import {
  Badge,
  GameProgress,
  GamingOnboarding,
  UserBadge,
} from '@app/gamified/entities';
import { Referral, ReferralRewardSetting } from '@app/referral/entities';
import { Subscription, SubscriptionHistory } from '@app/subscription/entities';
import {
  FollowTraders,
  TradeActivityFeeds,
  Trades,
} from '@app/trades/entities';
import { Privileges, RoleModel } from '@app/users/entity';
import { User } from '@app/users/entity/user.entity';
import { Account, Transaction, Wallets } from '@app/wallets/entities';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BlogManager } from 'src/app/blog-manager/entities/blog-manager.entity';
import { EmailCenter, WaitList } from 'src/app/email-center/entities';
import { LearningHub } from 'src/app/learninghub/entities/learninghub.entity';

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
    TradeActivityFeeds,
    FollowTraders,
    Transaction,
    Wallets,
    Account,
    Referral,
    ReferralRewardSetting,
    Subscription,
    SubscriptionHistory,
  ],
  ssl:
    process.env.NODE_ENV === 'development'
      ? false
      : { rejectUnauthorized: false }, // TODO
  synchronize: process.env.NODE_ENV === 'development', // TODO
});
