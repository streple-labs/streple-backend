// src/auth/constants.ts
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment variables');
}

if (!process.env.JWT_EXPIRES) {
  throw new Error('Missing JWT_EXPIRES in environment variables');
}

export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES,
};
