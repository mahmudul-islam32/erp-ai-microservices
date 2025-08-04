import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService, UserRole } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = this.getRequest(context);
    const token = this.extractTokenFromHeader(request) || this.extractTokenFromCookie(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const user = await this.authService.validateToken(token);
      user.role = this.authService.mapRoleToEnum(user.role);
      request['user'] = user;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid token');
    }

    return true;
  }

  private getRequest(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req;
    }
    return context.switchToHttp().getRequest();
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractTokenFromCookie(request: any): string | undefined {
    // Check for access_token in cookies
    const cookies = request.cookies;
    if (cookies && cookies.access_token) {
      return cookies.access_token;
    }
    
    // Also check for Authorization cookie with Bearer format
    if (cookies && cookies.Authorization) {
      const [type, token] = cookies.Authorization.split(' ');
      return type === 'Bearer' ? token : undefined;
    }
    
    return undefined;
  }
}
