import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, mixin, Type } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const RoleGuard = (roles: string[]): Type<CanActivate> => {
  // uses JwtStrategy from ./jwt.strategy.ts
  // since that class extends Strategy from passport-jwt
  // Request → RoleGuard → AuthGuard('jwt') → Passport.js → JwtStrategy → validate()
  // passport strategy has same name jwt as
  @Injectable()
  class RoleGuardMixin extends AuthGuard('jwt') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      // First run the JWT authentication
      await super.canActivate(context);

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user || !user.roles) {
        throw new UnauthorizedException('User roles not found');
      }

      const hasRole = roles.some((role) => user.roles.includes(role));

      if (!hasRole) {
        throw new UnauthorizedException(`User does not have required roles: ${roles.join(', ')}`);
      }

      return true;
    }
  }

  return mixin(RoleGuardMixin);
}
