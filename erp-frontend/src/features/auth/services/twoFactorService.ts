import { authApi } from '../../../shared/api/client';

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export interface TwoFactorVerifyResponse {
  verified: boolean;
  backup_codes?: string[];
}

export interface TwoFactorLoginRequest {
  email: string;
  password: string;
  code?: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  has_backup_codes: boolean;
}

export const twoFactorService = {
  setup: async (): Promise<TwoFactorSetupResponse> => {
    const response = await authApi.post('/api/v1/auth/2fa/setup', {});
    return response.data;
  },

  verify: async (code: string): Promise<TwoFactorVerifyResponse> => {
    const response = await authApi.post('/api/v1/auth/2fa/verify', { code });
    return response.data;
  },

  login: async (email: string, password: string, code: string): Promise<any> => {
    const response = await authApi.post('/api/v1/auth/2fa/login', {
      email,
      password,
      code,
    });
    return response.data;
  },

  disable: async (password: string, code?: string): Promise<void> => {
    await authApi.post('/api/v1/auth/2fa/disable', {
      password,
      code,
    });
  },

  regenerateBackupCodes: async (): Promise<{ backup_codes: string[] }> => {
    const response = await authApi.post('/api/v1/auth/2fa/backup-codes', {});
    return response.data;
  },

  getStatus: async (): Promise<TwoFactorStatus> => {
    const response = await authApi.get('/api/v1/auth/2fa/status');
    return response.data;
  },
};

