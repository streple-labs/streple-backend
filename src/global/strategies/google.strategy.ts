// src/auth/strategies/google.strategy.ts
import { UsersService } from '@app/users/service';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
dotenv.config();

interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale?: string;
  hd?: string;
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Missing GOOGLE_CLIENT_ID in environment variables');
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_SECRET in environment variables');
}

if (!process.env.BASE_URL) {
  throw new Error('Missing BASE_URL in environment variables');
}

const GOOGLE_CALLBACK_URL = `${process.env.BASE_URL}/auth/google/redirect`;

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string, // Short-lived Google token
    refreshToken: string, // Token to get new access tokens
    profile: Profile, // Google user profile
    done: VerifyCallback,
  ): Promise<void> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const googleUser: GoogleUser = await response.json();
    const email = googleUser.email;
    const fullName = googleUser.name;
    const avatarUrl = googleUser.picture;

    if (!email) {
      return done(new Error('Email not found in Google profile'), false);
    }

    let user = await this.users.findByEmail(email);
    if (!user) {
      user = await this.users.createUserWithGoogle({
        fullName,
        email,
        avatarUrl,
        password: randomBytes(32).toString('base64url'),
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, otp, otpExpiresAt, ...sanitizedUser } = user;
    const authUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const streple_auth_token = this.jwt.sign(authUser, {
      expiresIn: '1h',
    });
    const streple_refresh_token = this.jwt.sign(authUser, {
      expiresIn: '2h',
    });

    return done(null, {
      user: sanitizedUser,
      accessToken: streple_auth_token,
      refreshToken: streple_refresh_token,
    });
  }
}
