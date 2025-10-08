export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  role?: string;
  permissions?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

