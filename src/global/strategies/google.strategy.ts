/* eslint-disable @typescript-eslint/no-unused-vars */
import { UsersService } from '@app/users/service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private users: UsersService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${configService.getOrThrow('BASE_URL')}/auth/google/redirect`,
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

    const {
      password,
      tfaSecret,
      otp,
      otpExpiresAt,
      transactionPin,
      ...sanitizedUser
    } = user;

    return done(null, { user: sanitizedUser });
  }
}
