import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from '@app/users/user.entity';
dotenv.config();

if (!process.env.ADMIN_EMAIL) {
  throw new Error('Missing ADMIN_EMAIL in environment variables');
}

const dataSource = new DataSource({
  type: (process.env.DB_TYPE as 'postgres' | 'mysql') || 'postgres',
  url: process.env.DATABASE_URL, // Ignores `host`, `port`, `username`, `password`, `database`
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User],
  ssl: {
    rejectUnauthorized: false, // TODO: disable cert validation (okay for Railway, Heroku, etc.)
  },
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  const exists = await repo.findOneBy({
    email: process.env.ADMIN_EMAIL as string,
  });
  if (exists) {
    console.log('Admin already exists.');
    process.exit();
  }

  const admin = repo.create({
    fullName: process.env.ADMIN_FULL_NAME as string,
    email: process.env.ADMIN_EMAIL as string,
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 10),
  });

  await repo.save(admin);
  console.log('✅ Admin created');
  process.exit();
}

// HOW TO RUN: `npx ts-node src/seed/seed-admin.ts`
seed();
