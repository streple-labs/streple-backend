import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredCaps = this.reflector.get<string[]>(
      'capabilities',
      context.getHandler(),
    );
    if (!requiredCaps) return true; // No restriction

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Example: requiredCaps might be ['blog:BLOG_DELETE']
    return requiredCaps.every((reqCap) => {
      const [module, cap] = reqCap.split(':');
      return user.capabilities[module]?.includes(cap);
    });
  }
}
