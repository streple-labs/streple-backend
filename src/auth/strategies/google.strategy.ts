// src/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

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
    const email = profile.emails?.[0]?.value;
    const fullName =
      `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim();
    const avatarUrl = profile.photos?.[0]?.value ?? undefined;

    // TODO
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const googleUser = await response.json(); // fullName = googleUser.name
    // TODO
    console.log(`googleUser: ${JSON.stringify(googleUser)}`);

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

    const { password, otp, otpExpiresAt, ...sanitizedUser } = user;

    const streple_auth_token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return done(null, {
      user: sanitizedUser,
      accessToken: streple_auth_token,
    });
  }
}
