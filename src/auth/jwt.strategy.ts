import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from './constants';
import { UsersService } from '../users/users.service';
import { AdminsService } from 'src/admins/admins.service';
import { Role } from 'src/users/enums/role.enum';

interface JwtPayload {
  sub: string; // user id
  iat: number; // issued‑at
  exp: number; // expiration
  role: 'user' | 'admin'; // role must be included in the JWT
}

interface UserFromJwt {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly users: UsersService,
    private readonly admins: AdminsService,
  ) {
    super({
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
    let userOrAdmin: any;

    if (payload.role === 'admin') {
      userOrAdmin = await this.admins.findById(payload.sub);
    } else if (Object.values(Role).includes(payload.role as Role)) {
      userOrAdmin = await this.users.findById(payload.sub);
    } else {
      throw new UnauthorizedException('Invalid role in token');
    }

    if (!userOrAdmin) throw new UnauthorizedException();

    return {
      id: userOrAdmin.id,
      email: userOrAdmin.email,
      role: userOrAdmin.role ?? payload.role,
    };
  }
}
