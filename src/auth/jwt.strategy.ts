import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from './constants';
import { UsersService } from '../users/users.service';

interface JwtPayload {
  sub: string; // user id
  iat: number; // issued‑at
  exp: number; // expiration
}

interface UserFromJwt {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly users: UsersService) {
    super({
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try Authorization Bearer token first
        ExtractJwt.fromAuthHeaderAsBearerToken(),

        // 2. Then try streple_auth_token from cookies
        (req: Request) => {
          return req?.cookies?.streple_auth_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserFromJwt> {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role };
  }
}
