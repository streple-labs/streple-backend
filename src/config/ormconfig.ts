import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Admin } from 'src/app/admins/admin.entity';
import { User } from '../app/users/user.entity';
import { CopyWallet } from '../app/copy-trading/entities/copy-wallet.entity';
import { CopyTrade } from '../app/copy-trading/entities/copy-trade.entity';
import { ProSignal } from '../app/copy-trading/entities/pro-signal.entity';
import { EmailCenter } from 'src/app/email-center/entities/email-center.entity';
import { LearningHub } from 'src/app/learninghub/entities/learninghub.entity';

export default (): TypeOrmModuleOptions => ({
  type: (process.env.DB_TYPE as 'postgres' | 'mysql') || 'postgres',
  url: process.env.DATABASE_URL, // Ignores `host`, `port`, `username`, `password`, `database`
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    Admin,
    User,
    CopyWallet,
    CopyTrade,
    ProSignal,
    EmailCenter,
    LearningHub,
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
