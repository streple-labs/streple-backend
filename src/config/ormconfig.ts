import { GameProgress, GamingOnboarding } from '@app/gamified/entities';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BlogManager } from 'src/app/blog-manager/entities/blog-manager.entity';
import { CopyTrade } from 'src/app/copy-trading/entities/copy-trade.entity';
import { CopyWallet } from 'src/app/copy-trading/entities/copy-wallet.entity';
import { ProSignal } from 'src/app/copy-trading/entities/pro-signal.entity';
import { Course } from 'src/app/course/course.entity';
import { EmailCenter } from 'src/app/email-center/entities/email-center.entity';
import { LearningHub } from 'src/app/learninghub/entities/learninghub.entity';
import { User } from '@app/users/entity/user.entity';
import { Privileges, RoleModel } from '@app/users/entity';

export default (): TypeOrmModuleOptions => ({
  type: (process.env.DB_TYPE as 'postgres' | 'mysql') || 'postgres',
  url: process.env.DATABASE_URL, // Ignores `host`, `port`, `username`, `password`, `database`
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
    RoleModel,
    Privileges,
  ],
  ssl: {
    rejectUnauthorized: false, // TODO: disable cert validation (okay for Railway, Heroku, etc.)
  },
  synchronize: true, // TODO: ✅ auto‑sync for dev; switch off in prod! (make false)
  ...(process.env.DB_TYPE === 'mysql' && {
    charset: 'utf8mb4', // full Unicode incl. emoji
    timezone: 'Z', // UTC; MySQL needs explicit tz
  }),
});
