import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  phone?: string;
  status: string;
  permissions: string[];
  is_active: boolean;
  is_superuser: boolean;
}

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:8001');
    console.log('Auth Service URL:', this.authServiceUrl); // Debug log
  }

  async validateToken(token: string): Promise<User> {
    try {
      const response = await axios.get(`${this.authServiceUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      });

      if (response.status === 200 && response.data) {
        const userData = response.data;
        return {
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          department: userData.department,
          phone: userData.phone,
          status: userData.status,
          permissions: userData.permissions || [],
          is_active: userData.status === 'ACTIVE',
          is_superuser: userData.role === 'ADMIN',
        };
      }

      throw new UnauthorizedException('Invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Token expired or invalid');
      }
      
      console.error('Auth service validation error:', error.message);
      throw new UnauthorizedException('Authentication service unavailable');
    }
  }

  async validateUser(userId: string): Promise<User> {
    try {
      const response = await axios.get(`${this.authServiceUrl}/api/v1/users/${userId}`, {
        timeout: 5000,
      });

      if (response.status === 200 && response.data) {
        return response.data;
      }

      throw new UnauthorizedException('User not found');
    } catch (error) {
      if (error.response?.status === 404) {
        throw new UnauthorizedException('User not found');
      }
      
      console.error('Auth service user validation error:', error.message);
      throw new UnauthorizedException('Authentication service unavailable');
    }
  }

  mapRoleToEnum(role: string): UserRole {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'super_admin':
      case 'superuser':
        return UserRole.ADMIN;
      case 'manager':
        return UserRole.MANAGER;
      case 'staff':
        return UserRole.STAFF;
      case 'viewer':
      case 'user':
        return UserRole.VIEWER;
      default:
        console.log(`Unknown role: ${role}, defaulting to VIEWER`); // Debug log
        return UserRole.VIEWER;
    }
  }
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  VIEWER = 'viewer',
}
