import { jwtConstants } from '@app/auth/constants';
import { Role } from '@app/users/interface';
import { RoleService } from '@app/users/service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
  iat: number; // issued‑at
  exp: number; // expiration
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly users: RoleService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try Authorization Bearer token first
        ExtractJwt.fromAuthHeaderAsBearerToken(),

        // 2. Then try streple_auth_token from cookies
        (req: Request) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return req?.cookies?.streple_auth_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.getSingleUserWithRoleAndPermission({
      id: payload.sub,
    }); //findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(
        'You are not authorized to perform the operation',
      );
    }
    return user;
  }
}
