import { CAPABILITY_KEY } from '@app/decorators';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredCaps = this.reflector.get<string[]>(
      CAPABILITY_KEY,
      context.getHandler(),
    );
    if (!requiredCaps) return true; // No restriction

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const priv = user?.roles?.privileges;

    return requiredCaps.every((reqCap) => {
      const access = priv[0].privileges;
      if (access.includes('all')) return true; // If user has 'all' permission, allow
      const isValid = priv[0].privileges?.includes(reqCap);
      return isValid;
    });
  }
}
