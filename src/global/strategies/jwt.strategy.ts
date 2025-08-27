import { jwtConstants } from '@app/auth/constants';
import { JwtPayload } from '@app/common';
import { RoleService } from '@app/users/service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly users: RoleService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try Authorization Bearer token first
        ExtractJwt.fromAuthHeaderAsBearerToken(),

        // 2. Then try streple_auth_token from cookies
        (req: Request): string | null => {
          const token: unknown =
            req?.cookies?.streple_auth_token ||
            req?.cookies?.streple_refresh_token;

          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.getSingleUserWithRoleAndPermission({
      id: payload.id,
    });
    if (!user) {
      throw new UnauthorizedException(
        'You are not authorized to perform the operation',
      );
    }
    return user;
  }
}
