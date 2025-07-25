import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_STATUS_CHECK_KEY } from '../decorators/status.decorator';
import { userStatus } from '../common';

@Injectable()
export class StatusGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipCheck = this.reflector.get<boolean>(
      SKIP_STATUS_CHECK_KEY,
      context.getHandler(),
    );
    if (skipCheck) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException(['User not logged in']);
    }

    if (user.status !== userStatus.active) {
      throw new ForbiddenException([
        'Your account is suspended, please contact support for more information',
      ]);
    }

    return true;
  }
}
