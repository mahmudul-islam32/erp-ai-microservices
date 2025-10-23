import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try to extract from cookies (for frontend requests)
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-super-secret-key'),
    });
  }

  async validate(payload: any) {
    console.log('🔐 JwtStrategy.validate - payload:', payload);
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      sub: payload.sub,  // Also include sub for compatibility
    };
  }
}
